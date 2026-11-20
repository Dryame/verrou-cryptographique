#!/bin/bash
# ==============================================================================
# Script de correction finale et creation des tables (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. CORRECTION DE MAIN.PY ===${NC}"

# On corrige la ligne 53 de main.py qui utilise l'ancien nom
python3 - << 'EOF'
import os

filepath = "backend/app/main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remplacement de l'ancien nom par le nouveau (sans le _hex)
    content = content.replace("payload.cle_pub_revocation_hex", "payload.cle_pub_revocation")
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] main.py corrige : payload.cle_pub_revocation_hex -> payload.cle_pub_revocation")
EOF

echo -e "\n${BLUE}[INFO] === 2. RECONSTRUCTION ET REDEMARRAGE ===${NC}"
docker-compose up -d --build backend

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes...${NC}"
sleep 5

echo -e "\n${BLUE}[INFO] === 3. CREATION DES TABLES DANS POSTGRESQL ===${NC}"
# On utilise les bons imports (models.Base et database.engine)
docker-compose exec -T backend python -c "
import asyncio
from app.database import engine
from app.models import Base

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('[OK] Tables creees avec succes !')

asyncio.run(init_db())
"

echo -e "\n${BLUE}[INFO] === 4. TEST ULTIME ===${NC}"

H32="11111111111111111111111111111111"
H64="2222222222222222222222222222222222222222222222222222222222222222"
H128="33333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333"

# On utilise le bon nom de champ dans le JSON
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
