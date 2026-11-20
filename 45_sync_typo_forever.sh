#!/bin/bash
# ==============================================================================
# Script pour synchroniser l'orthographe (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === SYNCHRONISATION DE L'ORTHOGRAPHE ===${NC}"

python3 - << 'EOF'
# On remplace "Revoker" (k) par "Revoquer" (q) dans TOUS les fichiers concernés
for filepath in ["backend/app/schemas.py", "backend/app/main.py"]:
    try:
        with open(filepath, "r") as f:
            content = f.read()
        
        # Remplacement
        content = content.replace("RevokerIdentiteRequest", "RevoquerIdentiteRequest")
        
        with open(filepath, "w") as f:
            f.write(content)
        print(f"[OK] {filepath} synchronise avec 'Revoquer'.")
    except FileNotFoundError:
        pass
EOF

echo -e "\n${BLUE}[INFO] === RECONSTRUCTION DE DOCKER ===${NC}"
docker-compose up -d --build backend

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
