#!/bin/bash
# ==============================================================================
# Script de nettoyage des caracteres unicode invisibles (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === NETTOYAGE PROFOND DES FICHIERS PYTHON ===${NC}"

python3 - << 'EOF'
import re

files_to_clean = ["backend/app/main.py", "backend/app/schemas.py"]

for filepath in files_to_clean:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Suppression de TOUS les caracteres non-ASCII (invisibles, cyrilliques, etc.)
        # Cela va aussi supprimer les accents, ce qui est parfait pour du code Python.
        content = re.sub(r'[^\x00-\x7F]+', '', content)

        # 2. On s'assure que le nom du champ est ecrit proprement avec de l'ASCII pur
        # On utilise une expression reguliere pour trouver le mot et le remplacer par la version saine
        content = re.sub(r'cle_pub_revocation_hex', 'cle_pub_revocation_hex', content)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        
        print(f"[OK] {filepath} a ete purifie (ASCII uniquement).")
    except FileNotFoundError:
        print(f"[ATTENTION] Fichier introuvable : {filepath}")
EOF

echo -e "\n${BLUE}[INFO] === RECONSTRUCTION COMPLETE DE DOCKER ===${NC}"
docker-compose down
docker-compose up -d --build backend

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes...${NC}"
sleep 5

echo -e "\n${BLUE}[INFO] === TEST ULTIME ===${NC}"

H32="11111111111111111111111111111111"
H64="2222222222222222222222222222222222222222222222222222222222222222"
H128="33333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333"

JSON_PAYLOAD=$(cat <<EOF
{
  "prenom": "Idrissa",
  "sel_derivation_hex": "$H32",
  "cle_pub_chiffrement_hex": "$H64",
  "cle_pub_signature_hex": "$H64",
  "cle_pub_revocation_hex": "$H64",
  "empreinte": "$H64",
  "signature_enregistrement_hex": "$H128",
  "argon2_memoire": 65536,
  "argon2_iterations": 3
}
EOF
)

curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/api/v1/profils" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD"

echo -e "\n${GREEN}=== FIN DU TEST ===${NC}"
