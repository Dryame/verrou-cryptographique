#!/bin/bash
# ==============================================================================
# Script de correction ultime de schemas.py (Phase 6)
# Ce script supprime la classe ProfilCreate et la recrée a la fin du fichier.
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

echo -e "${BLUE}[INFO] === NETTOYAGE PROFOND DE SCHEMAS.PY ===${NC}"

# On utilise Python pour une manipulation chirurgicale
python3 - << 'EOF'
import re

file_path = "backend/app/schemas.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. On supprime completement l'ancienne classe ProfilCreate (peu importe son contenu)
content = re.sub(r'class ProfilCreate\(BaseModel\):.*?(?=\nclass |\Z)', '', content, flags=re.DOTALL)

# 2. On definit la classe parfaite (ASCII pur)
perfect_class = '''
class ProfilCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    prenom: str = Field(min_length=1, max_length=50)
    sel_derivation_hex: str = Field(pattern=r"^[0-9a-fA-F]{32}$")
    cle_pub_chiffrement_hex: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    cle_pub_signature_hex: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    cle_pub_revocation_hex: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    empreinte: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    signature_enregistrement_hex: str = Field(pattern=r"^[0-9a-fA-F]{128}$")
    argon2_memoire: int = 65536
    argon2_iterations: int = 3
'''

# 3. On ajoute la classe a la toute fin du fichier
content = content.strip() + "\n\n" + perfect_class

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("[OK] L'ancienne classe a ete supprimee et recreee en ASCII pur a la fin du fichier.")
EOF

echo -e "\n${BLUE}[INFO] === REDEMARRAGE DU BACKEND ===${NC}"
docker-compose restart backend

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes...${NC}"
sleep 5

echo -e "\n${BLUE}[INFO] === TEST ULTIME (Croisons les doigts) ===${NC}"

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
