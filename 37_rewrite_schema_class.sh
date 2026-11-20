#!/bin/bash
# ==============================================================================
# Script de reecriture complete de la classe ProfilCreate (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

SCHEMA_FILE="backend/app/schemas.py"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "\033[0;31m[ERREUR] Impossible de trouver $SCHEMA_FILE\033[0m"
    exit 1
fi

echo -e "${BLUE}[INFO] === RECONSTRUCTION COMPLETE DE LA CLASSE PROFILCREATE ===${NC}"

# On utilise Python pour chercher la classe et la remplacer de force
python3 - << 'EOF'
import re

file_path = "backend/app/schemas.py"
with open(file_path, "r") as f:
    content = f.read()

# On definit la classe parfaite
perfect_class = '''class ProfilCreate(BaseModel):
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

# On cherche la classe ProfilCreate jusqu'a la prochaine classe ou la fin du fichier
pattern = r"class ProfilCreate\(BaseModel\):.*?(?=\nclass |\Z)"
content = re.sub(pattern, perfect_class, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
print("[OK] La classe ProfilCreate a ete entierement reecrite.")
EOF

echo -e "\n${BLUE}[INFO] === REDEMARRAGE DU BACKEND ===${NC}"
docker-compose restart backend

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes...${NC}"
sleep 5

echo -e "\n${BLUE}[INFO] === TEST ULTIME (On croise les doigts) ===${NC}"

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
