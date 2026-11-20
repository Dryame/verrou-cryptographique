#!/bin/bash
# ==============================================================================
# Script de nettoyage chirurgical (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. REECRITURE PROPRE DE SCHEMAS.PY ===${NC}"

python3 - << 'EOF'
import re

file_path = "backend/app/schemas.py"
with open(file_path, "r") as f:
    content = f.read()

# On supprime completement la classe ProfilCreate actuelle
content = re.sub(r'class ProfilCreate\(BaseModel\):.*?(?=\nclass |\Z)', '', content, flags=re.DOTALL)

# On la reecrit a la fin, en ASCII pur, SANS espace avant les deux points
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

    @field_validator("prenom")
    @classmethod
    def nettoyer_prenom(cls, value: str) -> str:
        prenom = value.strip()
        if not prenom:
            raise ValueError("Le nom d'identite ne peut pas etre vide.")
        return prenom
'''

content = content.strip() + "\n\n" + perfect_class

with open(file_path, "w") as f:
    f.write(content)
print("[OK] schemas.py nettoye.")
EOF

echo -e "\n${BLUE}[INFO] === 2. RECONSTRUCTION DU ROUTEUR PROFILS.PY ===${NC}"

# On remplace le faux routeur par un vrai qui utilise ProfilCreate
cat << 'EOF' > backend/app/routers/profils.py
from fastapi import APIRouter, Request, Depends
from app.security_middleware import limiter
from app.schemas import ProfilCreate

router = APIRouter()

@router.post("/profils")
@limiter.limit("5/minute")
async def handle_profils(request: Request, profil: ProfilCreate):
    # Ici, votre logique de base de donnees devrait s'executer
    # Pour le test, on renvoie simplement les donnees validees
    return {"message": "Profil recu et valide", "data": profil.model_dump()}
EOF
echo -e "${GREEN}[OK] Le routeur profils.py a ete reecrit avec le bon schema.${NC}"

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE DU BACKEND ===${NC}"
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
