#!/bin/bash
# ==============================================================================
# Script de correction de l'architecture du projet (Phase 6)
# Ce script deplace les fichiers au bon endroit pour corriger les imports.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT/backend"

echo -e "${BLUE}[INFO] === CORRECTION DE L'ARCHITECTURE DU BACKEND ===${NC}"

# 1. Deplacement de security_middleware.py dans le dossier app/
if [ -f "security_middleware.py" ]; then
    echo -e "${GREEN}[OK] Deplacement de security_middleware.py vers app/${NC}"
    mv security_middleware.py app/
fi

# 2. Deplacement du dossier routers dans le dossier app/
if [ -d "routers" ]; then
    echo -e "${GREEN}[OK] Deplacement du dossier routers vers app/${NC}"
    # Si le dossier existe deja dans app/, on fusionne
    if [ -d "app/routers" ]; then
        cp -r routers/* app/routers/
        rm -rf routers
    else
        mv routers app/
    fi
fi

# 3. Creation des fichiers __init__.py pour que Python reconnaisse les dossiers
echo -e "${GREEN}[OK] Creation des fichiers __init__.py...${NC}"
touch app/__init__.py
touch app/routers/__init__.py

# 4. Verification de l'import dans main.py
# Maintenant que security_middleware est dans le meme dossier que main.py, l'import fonctionnera.

echo -e "\n${BLUE}[INFO] === RECONSTRUCTION DE L'IMAGE DOCKER ===${NC}"
cd "$PROJECT_ROOT"
docker-compose build --no-cache backend
docker-compose up -d

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour le demarrage...${NC}"
sleep 10

# 5. Verification des logs
echo -e "\n${BLUE}[INFO] Verification des logs du backend...${NC}"
if docker-compose logs backend | grep -q "ModuleNotFoundError"; then
    echo -e "${RED}[ERREUR] Une erreur d'import persiste.${NC}"
    docker-compose logs --tail=15 backend
    exit 1
else
    echo -e "${GREEN}[OK] Le backend a demarre sans erreur d'import.${NC}"
fi

echo -e "\n${GREEN}=== CORRECTION TERMINEE ===${NC}"
echo -e "Vous pouvez maintenant relancer le test d'integration : ./08_test_integration.sh"
