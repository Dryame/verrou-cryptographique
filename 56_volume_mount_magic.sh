#!/bin/bash
# ==============================================================================
# Script de montage de volume pour contourner le reseau Docker (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. APPLICATION DE LA CORRECTION DANS MAIN.PY ===${NC}"
# Correction ultime (au cas ou)
sed -i 's/payload\.cle_pub_revocation_hex/payload.cle_pub_revocation/g' backend/app/main.py
echo -e "${GREEN}[OK] Ligne 53 corrigee : payload.cle_pub_revocation_hex -> payload.cle_pub_revocation${NC}"

echo -e "\n${BLUE}[INFO] === 2. ACTIVATION DU VOLUME DANS DOCKER-COMPOSE.YML ===${NC}"
# On ajoute le volume pour lier le dossier local au conteneur
if ! grep -q "./backend/app:/app/app" docker-compose.yml; then
    # On insere la ligne juste avant depends_on
    sed -i '/depends_on:/i \    volumes:\n      - ./backend/app:/app/app' docker-compose.yml
    echo -e "${GREEN}[OK] Volume ajoute dans docker-compose.yml.${NC}"
else
    echo -e "${YELLOW}[ATTENTION] Le volume est deja configure.${NC}"
fi

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE (SANS TELECHARGEMENT DOCKER) ===${NC}"
# On force la recreation du conteneur pour appliquer le volume, sans faire de "build"
docker-compose up -d --force-recreate backend

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
  "cle_pub_revocation": "$H64",
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
