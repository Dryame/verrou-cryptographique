#!/bin/bash
# ==============================================================================
# Script de test d'integration (Phase 6)
# Ce script verifie la communication Backend -> Base de donnees.
# ==============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === DEMARRAGE DES CONTENEURS ===${NC}"
# On utilise le docker-compose de developpement
docker-compose up -d

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes pour que la base de donnees demarre...${NC}"
sleep 5

# ==============================================================================
# CONFIGURATION DU TEST (A ADAPTER SELON VOTRE CODE)
# ==============================================================================
API_URL="http://localhost:8000"
# Remplacez par votre vraie route de creation (ex: /api/v1/profils)
API_ENDPOINT="/profils" 
# Remplacez par un payload valide selon votre schemas.py
JSON_PAYLOAD='{"username": "test_integration", "public_key": "dGVzdF9rZXk="}' 

echo -e "\n${BLUE}[INFO] === TEST 1 : COMMUNICATION FRONTEND (SIMULE) -> BACKEND ===${NC}"
echo -e "Envoi d'une requete POST vers $API_URL$API_ENDPOINT"

# On utilise curl pour simuler l'appel du frontend
HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$API_ENDPOINT" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD")

# Separation du corps de la reponse et du code HTTP
HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')
HTTP_STATUS=$(echo "$HTTP_RESPONSE" | tail -n1)

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
    echo -e "${GREEN}[OK] Le Backend a repondu avec succes (Code $HTTP_STATUS).${NC}"
    echo -e "Reponse : $HTTP_BODY"
else
    echo -e "${RED}[ERREUR] Le Backend a renvoye une erreur (Code $HTTP_STATUS).${NC}"
    echo -e "Reponse : $HTTP_BODY"
    echo -e "${YELLOW}Verifiez si le payload JSON correspond a votre schemas.py${NC}"
    exit 1
fi

echo -e "\n${BLUE}[INFO] === TEST 2 : ECRITURE BACKEND -> BASE DE DONNEES ===${NC}"
# On demande a PostgreSQL de chercher la donnee qu'on vient d'inserer
echo -e "Verification dans la base de donnees PostgreSQL..."

# On suppose que votre table s'appelle "profils" et que vous avez une colonne "username"
# (A adapter si votre modele s'appelle autrement)
DB_QUERY="SELECT username FROM profils WHERE username='test_integration';"

# Execution de la requete dans le conteneur Docker de la base de donnees
DB_RESULT=$(docker-compose exec -T db psql -U verrou_user -d verrou_db -t -c "$DB_QUERY" | tr -d '[:space:]')

if [ "$DB_RESULT" = "test_integration" ]; then
    echo -e "${GREEN}[OK] La donnee a bien ete trouvee dans PostgreSQL.${NC}"
    echo -e "La chaine de communication Backend -> Base de donnees est parfaite."
else
    echo -e "${RED}[ERREUR] La donnee est introuvable dans PostgreSQL.${NC}"
    echo -e "Resultat de la requete : '$DB_RESULT'"
    exit 1
fi

echo -e "\n${BLUE}[INFO] === NETTOYAGE ===${NC}"
# On supprime la donnee de test pour ne pas polluer la base
docker-compose exec -T db psql -U verrou_user -d verrou_db -c "DELETE FROM profils WHERE username='test_integration';" > /dev/null
echo -e "${GREEN}[OK] Donnee de test supprimee.${NC}"

echo -e "\n${GREEN}=== TOUS LES TESTS D'INTEGRATION SONT PASSES AVEC SUCCES ===${NC}"
