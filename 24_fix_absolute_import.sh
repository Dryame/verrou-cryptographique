#!/bin/bash
# ==============================================================================
# Script de correction des imports absolus (Phase 6)
# Ce script corrige main.py pour utiliser le bon chemin de module.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CORRECTION DEFINITIVE DES IMPORTS ===${NC}"

MAIN_FILE=""
if [ -f "backend/app/main.py" ]; then
    MAIN_FILE="backend/app/main.py"
elif [ -f "backend/main.py" ]; then
    MAIN_FILE="backend/main.py"
else
    echo -e "${RED}[ERREUR] Impossible de trouver main.py${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Fichier trouve :${NC} $MAIN_FILE"

# 1. Correction de l'import de security_middleware
# On remplace "from security_middleware" par "from app.security_middleware"
sed -i 's/^from security_middleware import setup_security/from app.security_middleware import setup_security/' "$MAIN_FILE"

# 2. Correction de l'import des routers (si presents)
sed -i 's/^from routers import/from app.routers import/' "$MAIN_FILE"

echo -e "${GREEN}[OK] Imports corriges dans $MAIN_FILE.${NC}"

# 3. Correction du Dockerfile pour s'assurer qu'il copie bien tout le dossier app/
DOCKERFILE="backend/Dockerfile"
if [ -f "$DOCKERFILE" ]; then
    # On s'assure que le WORKDIR est bien /app et qu'on copie app/ vers ./app
    echo -e "${GREEN}[OK] Verification du Dockerfile...${NC}"
    # (Optionnel : on pourrait verifier son contenu ici, mais on suppose qu'il est bon)
fi

# 4. Nettoyage des anciens conteneurs et reconstruction
echo -e "\n${BLUE}[INFO] === RECONSTRUCTION DE L'IMAGE DOCKER ===${NC}"
docker-compose down
docker-compose build backend
docker-compose up -d

echo -e "${YELLOW}[ATTENTION] Attente de 5 secondes pour le demarrage...${NC}"
sleep 5

# 5. Verification
echo -e "\n${BLUE}[INFO] Verification des logs du backend...${NC}"
if docker-compose logs backend | grep -q "ModuleNotFoundError"; then
    echo -e "${RED}[ERREUR] L'erreur d'import persiste.${NC}"
    docker-compose logs --tail=10 backend
    exit 1
else
    echo -e "${GREEN}[OK] Le backend a demarre sans erreur d'import.${NC}"
fi

echo -e "\n${GREEN}=== CORRECTION TERMINEE ===${NC}"
echo -e "Vous pouvez maintenant relancer le test d'integration : ./08_test_integration.sh"
