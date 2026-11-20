#!/bin/bash
# ==============================================================================
# Script de correction definitive et de verification (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. INSPECTION DE LA LIGNE 53 ===${NC}"
# On affiche la ligne 53 pour voir a quoi elle ressemble exactement
sed -n '53p' backend/app/main.py

echo -e "\n${BLUE}[INFO] === 2. REMPLACEMENT DE FORCE AVEC PYTHON ===${NC}"
python3 - << 'EOF'
import re

filepath = "backend/app/main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# On remplace TOUTES les occurrences de payload.cle_pub_revocation_hex
# par payload.cle_pub_revocation, peu importe les espaces ou le contexte
content = re.sub(r'payload\.cle_pub_revocation_hex', 'payload.cle_pub_revocation', content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("[OK] Toutes les occurrences ont ete forcees vers 'payload.cle_pub_revocation'.")
EOF

echo -e "\n${BLUE}[INFO] === 3. RECONSTRUCTION COMPLETE DE DOCKER ===${NC}"
docker-compose up -d --build backend

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
