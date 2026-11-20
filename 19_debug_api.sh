#!/bin/bash
# ==============================================================================
# Script de diagnostic de la communication API (Phase 6)
# Ce script affiche les logs, teste la route et liste les tables de la BDD.
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. LOGS DU BACKEND (Dernières 20 lignes) ===${NC}"
docker-compose logs --tail=20 backend

echo -e "\n${BLUE}[INFO] === 2. TEST DIRECT DE LA ROUTE /profils ===${NC}"
echo -e "Envoi de la requete avec affichage des erreurs (-v)..."
# On n'utilise pas set -e ici pour voir l'erreur curl si elle existe
curl -v -X POST "http://localhost:8000/profils" \
     -H "Content-Type: application/json" \
     -d '{"username": "test_debug", "public_key": "dGVzdF9rZXk="}' 2>&1 | tail -n 15

echo -e "\n${BLUE}[INFO] === 3. ETAT DE LA BASE DE DONNEES ===${NC}"
echo -e "Verification de l'existence des tables..."
docker-compose exec -T db psql -U verrou_user -d verrou_db -c "\dt"

echo -e "\n${BLUE}[INFO] === FIN DU DIAGNOSTIC ===${NC}"
