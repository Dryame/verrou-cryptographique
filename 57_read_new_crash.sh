#!/bin/bash
# ==============================================================================
# Script pour lire la nouvelle erreur fatale (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === LECTURE DU NOUVEAU TRACEBACK (Erreur 500) ===${NC}"
# On affiche les 25 dernieres lignes pour voir la vraie exception
docker-compose logs --tail=25 backend

echo -e "\n${GREEN}=== FIN ===${NC}"
