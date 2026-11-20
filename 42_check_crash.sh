#!/bin/bash
# ==============================================================================
# Script de diagnostic du crash de demarrage (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. LECTURE DES LOGS DU BACKEND ===${NC}"
docker-compose logs --tail=25 backend

echo -e "\n${BLUE}[INFO] === 2. CORRECTION PREVENTIVE DES IMPORTS MANQUANTS ===${NC}"

# On ajoute la classe ContactResponse qui avait probablement ete effacee
cat << 'EOF' >> backend/app/schemas.py

class ContactResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    prenom: str
    empreinte: str
EOF
echo -e "${GREEN}[OK] La classe ContactResponse a ete remise dans schemas.py.${NC}"

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE DU BACKEND ===${NC}"
# Attention : On utilise restart ici car le code source est modifie, 
# mais pas besoin de rebuild l'image si le volume est monte. 
# Si le code n'est pas monte en volume, on fera un build.
docker-compose restart backend

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes...${NC}"
sleep 5

echo -e "\n${BLUE}[INFO] === 4. TEST ===${NC}"

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

echo -e "\n${GREEN}=== FIN ===${NC}"
