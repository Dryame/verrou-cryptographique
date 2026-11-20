#!/bin/bash
# ==============================================================================
# Script de diagnostic du paradoxe Pydantic (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. INSPECTION DES CLES EN MEMOIRE ===${NC}"

# On demande a Python d'afficher le nom exact de chaque champ avec sa longueur
docker-compose exec -T backend python -c "
from app.schemas import ProfilCreate
print('Voici les champs que Pydantic attend (avec leur longueur exacte) :')
for k in ProfilCreate.model_fields.keys():
    print(f\"  Nom : {repr(k)} | Longueur : {len(k)}\")
"

echo -e "\n${BLUE}[INFO] === 2. SCHEMA JSON OFFICIEL DE PYDANTIC ===${NC}"
# On affiche le schema que Pydantic genere
docker-compose exec -T backend python -c "
from app.schemas import ProfilCreate
import json
print(json.dumps(ProfilCreate.model_json_schema()['properties'], indent=2))
"

echo -e "\n${BLUE}[INFO] === 3. CONTENU BRUT DE SCHEMAS.PY ===${NC}"
# On affiche le fichier schemas.py (les 20 premieres lignes)
docker-compose exec -T backend head -n 30 app/schemas.py

echo -e "\n${BLUE}[INFO] === 4. CONTENU BRUT DU ROUTEUR ===${NC}"
# On affiche le fichier profils.py
docker-compose exec -T backend cat app/routers/profils.py

echo -e "\n${BLUE}[INFO] === FIN DU DIAGNOSTIC ===${NC}"
