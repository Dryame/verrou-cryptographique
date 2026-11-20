#!/bin/bash
# ==============================================================================
# Script de synchronisation forcee (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. REECRITURE DE SCHEMAS.PY AVEC LE BON NOM ===${NC}"

# On remet cle_pub_revocation_hex en ASCII pur (sans caractere invisible)
cat << 'EOF' > backend/app/schemas.py
from pydantic import BaseModel, ConfigDict, Field, field_validator

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

    @field_validator("prenom")
    @classmethod
    def nettoyer_prenom(cls, value: str) -> str:
        prenom = value.strip()
        if not prenom:
            raise ValueError("Le nom d'identite ne peut pas etre vide.")
        return prenom

class ContactResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    prenom: str
    empreinte: str

class RevoquerIdentiteRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    signature_hex: str = Field(pattern=r"^[0-9a-fA-F]{128}$")
EOF

echo -e "${GREEN}[OK] schemas.py reecrit avec 'cle_pub_revocation_hex'.${NC}"

# On s'assure que main.py utilise bien ce nom
sed -i 's/payload\.cle_pub_revocation/payload.cle_pub_revocation_hex/g' backend/app/main.py

echo -e "\n${BLUE}[INFO] === 2. VERIFICATION DE CE QUE DOCKER VOIT ===${NC}"
# On demande a Docker de lire le fichier schemas.py pour voir s'il est synchronise
echo -e "Recherche de 'cle_pub_revocation_hex' dans schemas.py vu par Docker :"
docker-compose exec -T backend grep "cle_pub_revocation_hex" app/schemas.py || echo -e "${RED}[ERREUR] Le conteneur ne voit pas le bon fichier. Le volume n'est pas monte.${NC}"

echo -e "\nRecherche de 'payload.cle_pub_revocation_hex' dans main.py vu par Docker :"
docker-compose exec -T backend grep "payload.cle_pub_revocation_hex" app/main.py || echo -e "${RED}[ERREUR] Le conteneur ne voit pas le bon fichier main.py.${NC}"

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE FORCE DU CONTENEUR ===${NC}"
docker-compose restart backend

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes...${NC}"
sleep 5

echo -e "\n${BLUE}[INFO] === 4. TEST ULTIME ===${NC}"

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
