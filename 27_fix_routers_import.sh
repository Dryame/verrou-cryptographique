#!/bin/bash
# ==============================================================================
# Script de correction des imports dans les routeurs (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CORRECTION DES IMPORTS DANS LE DOSSIER ROUTERS ===${NC}"

ROUTERS_DIR="backend/app/routers"

if [ ! -d "$ROUTERS_DIR" ]; then
    echo -e "${RED}[ERREUR] Dossier $ROUTERS_DIR introuvable.${NC}"
    exit 1
fi

# Boucle sur tous les fichiers Python dans le dossier routers
for file in "$ROUTERS_DIR"/*.py; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}[OK] Traitement de : $file${NC}"
        
        # Remplacement de l'import relatif par l'import absolu
        sed -i 's/^from security_middleware import limiter/from app.security_middleware import limiter/' "$file"
        
        # Verification
        if grep -q "from app.security_middleware import limiter" "$file"; then
            echo -e "    -> Import corrige avec succes."
        fi
    fi
done

# ==============================================================================
# Redemarrage
# ==============================================================================
echo -e "\n${BLUE}[INFO] === REDEMARRAGE DES CONTENEURS ===${NC}"
docker-compose down
docker-compose up -d --build

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour le demarrage complet...${NC}"
sleep 10

# Verification
echo -e "\n${BLUE}[INFO] Verification de l'etat du backend...${NC}"
if docker-compose ps | grep -q "backend.*Up"; then
    echo -e "${GREEN}[OK] Le conteneur backend est en cours d'execution.${NC}"
    
    echo -e "\n${BLUE}[INFO] === TEST DE LA ROUTE ===${NC}"
    # On affiche le code HTTP et la reponse
    curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/profils" \
         -H "Content-Type: application/json" \
         -d '{"username": "test_debug", "public_key": "dGVzdF9rZXk="}'
else
    echo -e "${RED}[ERREUR] Le backend n'a pas demarre.${NC}"
    docker-compose logs --tail=20 backend
    exit 1
fi

echo -e "\n${GREEN}=== TERMINE ===${NC}"
