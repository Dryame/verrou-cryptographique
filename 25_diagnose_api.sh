#!/bin/bash
# ==============================================================================
# Script de diagnostic approfondi de l'API (Phase 6)
# Ce script teste la connexion et inspecte la base de donnees sans s'arreter.
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. TEST DE CONNEXION DIRECTE A L'API ===${NC}"
echo -e "Envoi d'une requete POST vers http://localhost:8000/profils"
echo -e "Affichage de la reponse brute du serveur :"

# On utilise -s (silencieux) mais on affiche le code HTTP.
# Pas de set -e ici, on veut voir l'erreur !
curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/profils" \
     -H "Content-Type: application/json" \
     -d '{"username": "test_debug", "public_key": "dGVzdF9rZXk="}' 

echo -e "\n${BLUE}[INFO] === 2. ETAT DE LA BASE DE DONNEES ===${NC}"
echo -e "Verification des tables existantes dans PostgreSQL :"
docker-compose exec -T db psql -U verrou_user -d verrou_db -c "\dt"

echo -e "\n${BLUE}[INFO] === 3. VERIFICATION DES ROUTEURS DANS MAIN.PY ===${NC}"
if [ -f "backend/app/main.py" ]; then
    echo -e "Recherche de 'include_router' dans backend/app/main.py :"
    grep -n "include_router" backend/app/main.py || echo -e "${RED}[ATTENTION] Aucun routeur inclus ! Vos routes (comme /profils) n'existent pas.${NC}"
fi

echo -e "\n${BLUE}[INFO] === FIN DU DIAGNOSTIC ===${NC}"
