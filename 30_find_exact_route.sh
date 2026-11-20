#!/bin/bash
# ==============================================================================
# Script pour lister les routes exactes de l'API (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === LISTE DES ROUTES DISPONIBLES DANS FASTAPI ===${NC}"

# On demande à Python (à l'intérieur du conteneur) de lister les routes
docker-compose exec -T backend python -c "
from app.main import app
print('Voici les URLs que votre serveur accepte :')
for route in app.routes:
    if hasattr(route, 'methods'):
        print(f' - {list(route.methods)[0]} {route.path}')
"

echo -e "\n${BLUE}[INFO] === FIN DE LA LISTE ===${NC}"
