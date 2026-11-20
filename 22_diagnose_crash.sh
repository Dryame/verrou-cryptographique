#!/bin/bash
# ==============================================================================
# Script de diagnostic du crash du backend (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === ETAT DES CONTENEURS ===${NC}"
docker-compose ps

echo -e "\n${BLUE}[INFO] === LOGS DU BACKEND (50 dernieres lignes) ===${NC}"
docker-compose logs --tail=50 backend

echo -e "\n${BLUE}[INFO] === FIN DU DIAGNOSTIC ===${NC}"
