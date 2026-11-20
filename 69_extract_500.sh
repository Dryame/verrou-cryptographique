#!/bin/bash
# ==============================================================================
# Script d'extraction de la Traceback (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === EXTRACTION DU TRACEBACK DU BACKEND ===${NC}"

# On cherche la Traceback dans les 30 dernières lignes des logs
docker-compose logs --tail=30 backend | grep -A 25 "Traceback (most recent call last)"

echo -e "\n${GREEN}=== FIN DU DIAGNOSTIC ===${NC}"
