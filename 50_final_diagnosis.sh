#!/bin/bash
# ==============================================================================
# Script de diagnostic final (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. RECHERCHE DE LA CLASSE 'Base' ===${NC}"
# On cherche dans quels fichiers la classe Base est definie
grep -rn "declarative_base\|class Base" backend/app/ || echo -e "${RED}Impossible de trouver 'Base'.${NC}"

echo -e "\n${BLUE}[INFO] === 2. CONTENU DE MODELS.PY (Si existant) ===${NC}"
if [ -f "backend/app/models.py" ]; then
    cat backend/app/models.py
else
    echo -e "${YELLOW}Fichier models.py introuvable.${NC}"
fi

echo -e "\n${BLUE}[INFO] === 3. CONTENU DE DATABASE.PY ===${NC}"
if [ -f "backend/app/database.py" ]; then
    cat backend/app/database.py
else
    echo -e "${YELLOW}Fichier database.py introuvable.${NC}"
fi

echo -e "\n${BLUE}[INFO] === 4. LECTURE DU VRAI TRACEBACK (Erreur 500) ===${NC}"
# On affiche les dernieres lignes du backend pour voir pourquoi le code 500 arrive
docker-compose logs --tail=20 backend

echo -e "\n${GREEN}=== FIN DU DIAGNOSTIC ===${NC}"
