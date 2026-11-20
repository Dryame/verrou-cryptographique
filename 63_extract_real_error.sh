#!/bin/bash
# ==============================================================================
# Script d'extraction de l'erreur fatale (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === LECTURE DU TRACEBACK DU BACKEND ===${NC}"
# On filtre pour ne garder que la fin de l'erreur Python
docker-compose logs --tail=40 backend | grep -v "GET /" | grep -v "POST /"

echo -e "\n${GREEN}=== FIN ===${NC}"
