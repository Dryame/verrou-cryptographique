#!/bin/bash
# ==============================================================================
# Script de durcissement des schemas Pydantic (Phase 3 - Bouclier 5)
# Ce script force le rejet des champs inconnus pour prévenir les injections.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === DURCISSEMENT DES SCHEMAS PYDANTIC ===${NC}"

# Recherche du fichier schemas.py
SCHEMA_FILE=""
if [ -f "backend/schemas.py" ]; then
    SCHEMA_FILE="backend/schemas.py"
elif [ -f "backend/app/schemas.py" ]; then
    SCHEMA_FILE="backend/app/schemas.py"
else
    echo -e "${RED}[ERREUR] Impossible de trouver schemas.py.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Fichier trouve :${NC} $SCHEMA_FILE"
cp "$SCHEMA_FILE" "${SCHEMA_FILE}.bak"

# On utilise un script Python embarque pour modifier le fichier proprement
# (Plus fiable que sed pour manipuler du code Python)
python3 - << 'EOF'
import re

file_path = "backend/schemas.py"
import os
if not os.path.exists(file_path):
    file_path = "backend/app/schemas.py"

with open(file_path, "r") as f:
    content = f.read()

# 1. Ajouter l'import de ConfigDict si absent
if "ConfigDict" not in content:
    content = re.sub(
        r"from pydantic import (.*?)BaseModel",
        r"from pydantic import \1BaseModel, ConfigDict",
        content
    )
    # Si l'import n'était pas sur cette ligne, on l'ajoute en haut
    if "ConfigDict" not in content:
         content = "from pydantic import ConfigDict\n" + content

# 2. Ajouter la configuration "extra='forbid'" dans chaque classe BaseModel
# On cherche les classes qui héritent de BaseModel
def add_config(match):
    class_def = match.group(0)
    # Si la config n'est pas déjà présente
    if "model_config" not in class_def:
        # On injecte la configuration juste après la déclaration de la classe
        # en respectant l'indentation
        return class_def + "\n    model_config = ConfigDict(extra='forbid')\n"
    return class_def

# Regex pour trouver les classes héritant de BaseModel
content = re.sub(r"class \w+\(BaseModel\):", add_config, content)

with open(file_path, "w") as f:
    f.write(content)

print("[OK] Schemas Pydantic durcis avec succes.")
EOF

echo -e "\n${BLUE}[INFO] === SECURISATION DES SCHEMAS TERMINEE ===${NC}"
echo -e "Une sauvegarde a ete creee : ${YELLOW}${SCHEMA_FILE}.bak${NC}"
