#!/bin/bash
# ==============================================================================
# Script de correction des caracteres invisibles dans schemas.py (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

SCHEMA_FILE="backend/app/schemas.py"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}[ERREUR] Impossible de trouver $SCHEMA_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}[INFO] === NETTOYAGE DE SCHEMAS.PY ===${NC}"

# On utilise Python pour supprimer tous les espaces invisibles autour des noms de champs
python3 - << 'EOF'
import re

file_path = "backend/app/schemas.py"
with open(file_path, "r") as f:
    content = f.read()

# Supprime les espaces avant les deux points : "champ : str" -> "champ: str"
content = re.sub(r'([a-zA-Z0-9_]+)\s+:', r'\1:', content)

# Supprime les caracteres non-ASCII (invisibles) qui auraient pu se glisser
content = ''.join(c for c in content if ord(c) < 128 or c == '\n')

with open(file_path, "w") as f:
    f.write(content)
print("[OK] Fichier schemas.py nettoye avec succes.")
EOF

# Affichage de la ligne corrigee pour verification
echo -e "${YELLOW}Voici la nouvelle ligne dans schemas.py :${NC}"
grep "cle_pub_revocation_hex" "$SCHEMA_FILE" | sed 's/^/    /'

echo -e "\n${BLUE}[INFO] === REDEMARRAGE DU BACKEND ===${NC}"
docker-compose restart backend

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes pour le redemarrage...${NC}"
sleep 5

echo -e "\n${BLUE}[INFO] === TEST ULTIME DE L'API ===${NC}"

# On regenere le payload parfait
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
