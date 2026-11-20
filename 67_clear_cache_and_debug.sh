#!/bin/bash
# ==============================================================================
# Script de nettoyage des caches Python et redemarrage (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. SUPPRESSION DES CACHES PYTHON ===${NC}"
# Supprime les __pycache__ sur la machine hote et dans le conteneur
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
docker-compose exec -T backend find /app -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}[OK] Caches supprimes.${NC}"

echo -e "\n${BLUE}[INFO] === 2. REDEMARRAGE COMPLET DE DOCKER ===${NC}"
docker-compose down
docker-compose up -d
sleep 5

echo -e "\n${BLUE}[INFO] === 3. LECTURE DU TRACEBACK EXACT ===${NC}"
# On envoie une requete vide pour forcer l'erreur et voir le log
curl -s -X POST "http://localhost:8000/api/v1/profils" -H "Content-Type: application/json" -d '{}' > /dev/null

# On affiche les dernieres lignes des logs pour voir la VRAIE erreur
docker-compose logs --tail=25 backend

echo -e "\n${GREEN}=== FIN ===${NC}"
