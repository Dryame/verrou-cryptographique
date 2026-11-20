#!/bin/bash
# ==============================================================================
# Script pour lire le Traceback exact de l'erreur 500 (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === LECTURE DU TRACEBACK (Erreur 500) ===${NC}"
# On affiche les 20 dernieres lignes des logs pour voir l'erreur exacte
docker-compose logs --tail=20 backend

echo -e "\n${BLUE}[INFO] === ETAT DE LA BASE DE DONNEES ===${NC}"
# On regarde si les tables existent
docker-compose exec -T db psql -U verrou_user -d verrou_db -c "\dt"

echo -e "\n${GREEN}=== FIN ===${NC}"
