#!/bin/bash
# ==============================================================================
# Script d'affichage du modele (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CONTENU DU FICHIER MODELS.PY ===${NC}"
# On affiche le fichier en entier
cat backend/app/models.py

echo -e "\n${GREEN}=== FIN ===${NC}"
