#!/bin/bash
# ==============================================================================
# Script de test final de l'API avec la vraie route (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === TEST DE LA ROUTE /api/v1/profils ===${NC}"

# On teste la route exacte trouvee par le script precedent
# Note : Si votre schemas.py attend d'autres champs (ex: 'empreinte'), il faudra adapter le JSON ci-dessous.
curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/api/v1/profils" \
     -H "Content-Type: application/json" \
     -d '{"username": "test_integration", "public_key": "dGVzdF9rZXk="}'

echo -e "\n${BLUE}[INFO] === FIN DU TEST ===${NC}"
