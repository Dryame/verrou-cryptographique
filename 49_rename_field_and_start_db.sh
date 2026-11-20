#!/bin/bash
# ==============================================================================
# Script de renommage du champ et redemarrage complet (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. RENOMMAGE DU CHAMP DANS SCHEMAS ET MAIN ===${NC}"

# On utilise Python pour remplacer "cle_pub_revocation_hex" par "cle_pub_revocation"
python3 - << 'EOF'
import os

files = ["backend/app/schemas.py", "backend/app/main.py"]
for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Remplacement magique qui contourne le caractere invisible
        content = content.replace("cle_pub_revocation_hex", "cle_pub_revocation")
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[OK] Champ renomme dans {filepath}")
EOF

echo -e "\n${BLUE}[INFO] === 2. REDEMARRAGE COMPLET DES CONTENEURS ===${NC}"
# On relance la base de donnees et on reconstruit le backend
docker-compose up -d --build

echo -e "${YELLOW}[ATTENTION] Attente de 8 secondes pour que PostgreSQL demarre...${NC}"
sleep 8

echo -e "\n${BLUE}[INFO] === 3. CREATION DES TABLES (Si necessaire) ===${NC}"
# On demande a SQLAlchemy de creer les tables
docker-compose exec -T backend python -c "
from app.database import engine, Base
from app.models import Profil
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('[OK] Tables creees en base de donnees.')
import asyncio
asyncio.run(init_db())
" || echo -e "${YELLOW}[INFO] La commande de creation de table a echoue ou les tables existent deja.${NC}"

echo -e "\n${BLUE}[INFO] === 4. TEST ULTIME (Avec le nouveau nom de champ) ===${NC}"

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
