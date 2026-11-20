#!/bin/bash
# ==============================================================================
# Script de correction du timeout reseau Docker (Phase 6)
# Ce script modifie le Dockerfile pour augmenter le temps de telechargement.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CORRECTION DU TIMEOUT RESEAU DOCKER ===${NC}"

DOCKERFILE=""
if [ -f "backend/Dockerfile" ]; then
    DOCKERFILE="backend/Dockerfile"
elif [ -f "Dockerfile" ]; then
    DOCKERFILE="Dockerfile"
else
    echo -e "${RED}[ERREUR] Impossible de trouver le Dockerfile.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Fichier trouve :${NC} $DOCKERFILE"

# 1. Sauvegarde du Dockerfile
cp "$DOCKERFILE" "${DOCKERFILE}.bak"

# 2. Modification de la commande pip install pour ajouter du temps et des tentatives
# On cherche la ligne qui installe les requirements et on ajoute --default-timeout et --retries
sed -i 's/RUN pip install --no-cache-dir -r requirements.txt/RUN pip install --default-timeout=1000 --retries 10 --no-cache-dir -r requirements.txt/' "$DOCKERFILE"

# Si la ligne d'origine etait differente, on cherche toute ligne pip install
sed -i 's/RUN pip install .* -r requirements.txt/RUN pip install --default-timeout=1000 --retries 10 --no-cache-dir -r requirements.txt/' "$DOCKERFILE"

echo -e "${GREEN}[OK] Le Dockerfile a ete mis a jour avec un timeout plus long.${NC}"

# 3. Nettoyage du cache Docker pour eviter les fichiers partiellement telecharges
echo -e "\n${BLUE}[INFO] Nettoyage du cache de construction Docker...${NC}"
docker builder prune -f > /dev/null

# 4. Reconstruction
echo -e "\n${BLUE}[INFO] === RECONSTRUCTION DE L'IMAGE DOCKER (Cela peut prendre du temps) ===${NC}"
docker-compose build --no-cache backend

echo -e "\n${BLUE}[INFO] === DEMARRAGE DES CONTENEURS ===${NC}"
docker-compose up -d

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour le demarrage...${NC}"
sleep 10

# 5. Verification
echo -e "\n${BLUE}[INFO] Verification des logs du backend...${NC}"
if docker-compose logs backend | grep -q "ModuleNotFoundError"; then
    echo -e "${RED}[ERREUR] Une erreur d'import persiste.${NC}"
    exit 1
else
    echo -e "${GREEN}[OK] Le backend a demarre sans erreur d'import.${NC}"
fi

echo -e "\n${GREEN}=== CORRECTION TERMINEE ===${NC}"
echo -e "Vous pouvez maintenant relancer le test d'integration : ./08_test_integration.sh"
