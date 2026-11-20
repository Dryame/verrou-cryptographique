#!/bin/bash
# ==============================================================================
# Script d'inspection et de correction des noms de champs (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === INSPECTION DES CLES EXACTES DU MODELE ===${NC}"

# On demande a Python d'afficher les vrais noms des champs, avec leurs espaces caches
docker-compose exec -T backend python -c "
from app.schemas import ProfilCreate
print('Voici les noms EXACTS des champs (les guillemets montrent les espaces caches) :')
for field_name in ProfilCreate.model_fields.keys():
    print(f'  -> {repr(field_name)}')
"

echo -e "\n${BLUE}[INFO] === CORRECTION FORCEE DE SCHEMAS.PY ===${NC}"

# On utilise Python pour remplacer toute la ligne contenant cle_pub_revocation par une version propre
python3 - << 'EOF'
import re

file_path = "backend/app/schemas.py"
with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Si la ligne contient le nom du champ (peu importe les espaces)
    if "cle_pub_revocation" in line and ":" in line:
        # On force la reecriture propre de la ligne
        indent = line[:len(line) - len(line.lstrip())]
        # On garde la partie droite (le type et le Field)
        right_part = line.split(":", 1)[1].strip()
        # On ecrit la ligne parfaite
        new_lines.append(f"{indent}cle_pub_revocation_hex: {right_part}\n")
    else:
        new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)
print("[OK] Ligne 'cle_pub_revocation_hex' reecrite proprement.")
EOF

echo -e "\n${BLUE}[INFO] === REDEMARRAGE DU BACKEND ===${NC}"
docker-compose restart backend

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
