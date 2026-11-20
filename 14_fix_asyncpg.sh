#!/bin/bash
# ==============================================================================
# Script de correction de la dependance asyncpg (Phase 6)
# Ce script met a jour asyncpg vers une version compatible avec Python 3.12.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CORRECTION DE LA DEPENDANCE ASYNCPG ===${NC}"

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

# 1. Sauvegarde du fichier
cp "$REQ_FILE" "${REQ_FILE}.bak"

# 2. Mise a jour de la version d'asyncpg
# Remplace la ligne asyncpg==0.29.0 par asyncpg>=0.30.0,<0.32.0
sed -i 's/^asyncpg==0\.29\.0/asyncpg>=0.30.0,<0.32.0/' "$REQ_FILE"

# Si la ligne n'a pas ete trouvee avec le pattern exact, on cherche plus large
if grep -q "asyncpg==" "$REQ_FILE"; then
    sed -i 's/^asyncpg==.*/asyncpg>=0.30.0,<0.32.0/' "$REQ_FILE"
fi

echo -e "${GREEN}[OK] Fichier requirements.txt mis a jour.${NC}"
echo -e "Ligne asyncpg actuelle :"
grep "asyncpg" "$REQ_FILE" | while read -r line; do echo -e " - $line"; done

# 3. Relance de Docker avec le fichier corrige
echo -e "\n${BLUE}[INFO] === RECONSTRUCTION DE L'IMAGE DOCKER ===${NC}"
docker-compose build --no-cache backend

echo -e "\n${BLUE}[INFO] === DEMARRAGE DES CONTENEURS ===${NC}"
docker-compose up -d

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour l'initialisation de PostgreSQL...${NC}"
sleep 10

# 4. Verification des logs
echo -e "\n${BLUE}[INFO] Verification des logs du backend...${NC}"
if docker-compose logs backend | grep -q "InvalidPasswordError"; then
    echo -e "${RED}[ERREUR] L'erreur d'authentification persiste.${NC}"
    exit 1
else
    echo -e "${GREEN}[OK] Le backend a demarre sans erreur d'authentification.${NC}"
fi

echo -e "\n${GREEN}=== CORRECTION TERMINEE AVEC SUCCES ===${NC}"
echo -e "Vous pouvez maintenant relancer le test d'integration : ./08_test_integration.sh"
