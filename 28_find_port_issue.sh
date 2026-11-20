#!/bin/bash
# ==============================================================================
# Script de diagnostic du port 8000 (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. ETAT DES CONTENEURS ===${NC}"
docker-compose ps

echo -e "\n${BLUE}[INFO] === 2. LOGS DU BACKEND (Recherche d'erreur) ===${NC}"
docker-compose logs --tail=30 backend

echo -e "\n${BLUE}[INFO] === 3. VERIFICATION DU PORT MAPPING ===${NC}"
# Affiche quel port de la machine hote est lie au port 8000 du conteneur
docker-compose port backend 8000 || echo -e "${RED}[ERREUR] Le port 8000 n'est pas expose dans le docker-compose.yml !${NC}"

echo -e "\n${BLUE}[INFO] === 4. TEST INTERNE (Depuis le reseau Docker) ===${NC}"
# On essaie de joindre le backend depuis un autre conteneur (ou directement via Docker)
docker-compose exec -T backend curl -s -w "\nCode HTTP interne : %{http_code}\n" -X POST "http://localhost:8000/profils" \
     -H "Content-Type: application/json" \
     -d '{"username": "test_interne", "public_key": "dGVzdF9rZXk="}' || true

echo -e "\n${BLUE}[INFO] === 5. TEST EXTERNE (Depuis la machine hote) ===${NC}"
curl -s -w "\nCode HTTP externe : %{http_code}\n" -X POST "http://127.0.0.1:8000/profils" \
     -H "Content-Type: application/json" \
     -d '{"username": "test_externe", "public_key": "dGVzdF9rZXk="}' || true

echo -e "\n${BLUE}[INFO] === FIN DU DIAGNOSTIC ===${NC}"
