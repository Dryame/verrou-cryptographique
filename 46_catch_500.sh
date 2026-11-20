#!/bin/bash
# ==============================================================================
# Script pour capturer l'erreur fatale (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === LECTURE DE L'ERREUR DANS LES LOGS DU BACKEND ===${NC}"
# On cherche les dernieres lignes pour voir le Traceback de l'erreur 500
docker-compose logs --tail=30 backend

echo -e "\n${BLUE}[INFO] === VERIFICATION DU CODE DE LA ROUTE ===${NC}"
echo -e "Voici le code actuel de votre routeur profils.py :"
cat backend/app/routers/profils.py

echo -e "\n${GREEN}=== FIN DU DIAGNOSTIC ===${NC}"
