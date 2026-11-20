#!/bin/bash
# ==============================================================================
# Script de reconstruction forcee apres correction des schemas (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. RECONSTRUCTION COMPLETE DE SCHEMAS.PY ===${NC}"

# On ecrit les 3 classes necessaires pour que main.py soit content
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

class RevokerIdentiteRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    signature_hex: str = Field(pattern=r"^[0-9a-fA-F]{128}$")
EOF

echo -e "${GREEN}[OK] schemas.py recree avec les 3 classes.${NC}"

echo -e "\n${BLUE}[INFO] === 2. RECONSTRUCTION COMPLETE DE DOCKER (BUILD) ===${NC}"
# --build est CRUCIAL ici pour que Docker prenne le nouveau schemas.py
docker-compose up -d --build backend

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour le demarrage...${NC}"
sleep 10

echo -e "\n${BLUE}[INFO] === 3. VERIFICATION DES LOGS ===${NC}"
# On verifie si le serveur a survecu au demarrage
if docker-compose logs backend | grep -q "ImportError"; then
    echo -e "\033[0;31m[ERREUR] Le serveur a encore crashe a cause d'un import.${NC}"
    docker-compose logs --tail=20 backend
    exit 1
fi

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
