#!/bin/bash
# ==============================================================================
# Script d'affichage des logs bruts (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. LOGS BRUTS DU BACKEND (20 dernieres lignes) ===${NC}"
docker-compose logs --tail=20 backend

echo -e "\n${BLUE}[INFO] === 2. LECTURE DU CODE DE LA ROUTE (Lignes 60 a 90) ===${NC}"
# On affiche la partie qui gere la creation de la base de donnees
sed -n '60,90p' backend/app/main.py

echo -e "\n${BLUE}[INFO] === 3. STRUCTURE DE LA TABLE EN BASE ===${NC}"
# On regarde comment la table a ete creee par SQLAlchemy
docker-compose exec -T postgres psql -U verrou_user -d verrou_db -c "\d cle_identite"

echo -e "\n${GREEN}=== FIN DU DIAGNOSTIC ===${NC}"
