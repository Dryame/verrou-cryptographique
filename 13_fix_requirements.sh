#!/bin/bash
# ==============================================================================
# Script de correction du fichier requirements.txt
# Ce script separe les dependances collees et relance le build Docker.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CORRECTION DU FICHIER REQUIREMENTS.TXT ===${NC}"

REQ_FILE=""
if [ -f "backend/requirements.txt" ]; then
    REQ_FILE="backend/requirements.txt"
elif [ -f "backend/app/requirements.txt" ]; then
    REQ_FILE="backend/app/requirements.txt"
else
    echo -e "${RED}[ERREUR] Impossible de trouver requirements.txt.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Fichier trouve :${NC} $REQ_FILE"

# 1. Ajout d'un saut de ligne avant chaque occurrence de slowapi
# Cela corrige le probleme "python-dotenv==1.0.1slowapi"
sed -i 's/slowapi/\nslowapi/g' "$REQ_FILE"

# 2. Suppression des lignes vides eventuelles creees par la modification
sed -i '/^$/d' "$REQ_FILE"

# 3. Verification que python-dotenv a bien une version isolee
# (Si le script a colle les deux, on s'assure que python-dotenv est tout seul sur sa ligne)
sed -i 's/python-dotenv==1.0.1/python-dotenv==1.0.1\n/g' "$REQ_FILE"
sed -i '/^$/d' "$REQ_FILE"

echo -e "${GREEN}[OK] Le fichier requirements.txt a ete nettoye.${NC}"
echo -e "Contenu actuel du fichier :"
cat "$REQ_FILE" | while read -r line; do echo -e " - $line"; done

# ==============================================================================
# 4. Relance de Docker avec le fichier corrige
# ==============================================================================
echo -e "\n${BLUE}[INFO] === RELANCE DE DOCKER ===${NC}"
docker-compose down -v
docker-compose up -d --build

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour l'initialisation de PostgreSQL...${NC}"
sleep 10

# ==============================================================================
# 5. Verification
# ==============================================================================
echo -e "\n${BLUE}[INFO] Verification des logs du backend...${NC}"
if docker-compose logs backend | grep -q "InvalidPasswordError"; then
    echo -e "${RED}[ERREUR] L'erreur d'authentification persiste.${NC}"
    exit 1
else
    echo -e "${GREEN}[OK] Le backend a demarre sans erreur d'authentification.${NC}"
fi

echo -e "\n${GREEN}=== CORRECTION TERMINEE AVEC SUCCES ===${NC}"
echo -e "Vous pouvez maintenant relancer le test d'integration : ./08_test_integration.sh"
