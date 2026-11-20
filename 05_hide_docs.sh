#!/bin/bash
# ==============================================================================
# Script de protection de la documentation API (Phase 3 - Bouclier 6)
# Ce script desactive Swagger UI et OpenAPI en mode production.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === MASQUAGE DE LA DOCUMENTATION API EN PRODUCTION ===${NC}"

# Recherche du fichier main.py
MAIN_FILE=""
if [ -f "backend/main.py" ]; then
    MAIN_FILE="backend/main.py"
elif [ -f "backend/app/main.py" ]; then
    MAIN_FILE="backend/app/main.py"
else
    echo -e "${RED}[ERREUR] Impossible de trouver main.py.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Fichier trouve :${NC} $MAIN_FILE"

# On utilise Python pour faire une modification propre et securisee du code
python3 - << 'EOF'
import re
import os

# Determination du chemin
file_path = "backend/main.py"
if not os.path.exists(file_path):
    file_path = "backend/app/main.py"

with open(file_path, "r") as f:
    content = f.read()

# On verifie si la securite n'est pas deja en place
if 'docs_url=None if IS_PROD' not in content:
    
    # 1. On s'assure que 'os' est importe
    if 'import os' not in content:
        content = "import os\n" + content

    # 2. On injecte la logique de detection de l'environnement
    # On cherche la ligne "app = FastAPI()"
    # On la remplace par un bloc conditionnel
    replacement_code = '''# Detection de l'environnement de production
IS_PROD = os.getenv("ENVIRONMENT") == "production"

# En production, on desactive totalement la documentation pour eviter la divulgation d'informations
app = FastAPI(
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json"
)'''

    # Si la ligne est exactement "app = FastAPI()"
    if "app = FastAPI()" in content:
        content = content.replace("app = FastAPI()", replacement_code)
    # Si la ligne contient d'autres arguments (ex: app = FastAPI(title="..."))
    else:
        content = re.sub(r"app\s*=\s*FastAPI\([^)]*\)", replacement_code, content)

    with open(file_path, "w") as f:
        f.write(content)
    print("[OK] La configuration de main.py a ete mise a jour avec succes.")
else:
    print("[ATTENTION] La protection de la documentation est deja active.")
EOF

# Mise a jour du fichier .env.example pour ajouter la variable ENVIRONMENT
if [ -f ".env.example" ]; then
    if ! grep -q "ENVIRONMENT=" .env.example; then
        echo -e "\n# Environnement d'execution (development ou production)\nENVIRONMENT=development" >> .env.example
        echo -e "${GREEN}[OK] Variable ENVIRONMENT ajoutee a .env.example${NC}"
    fi
fi

# Mise a jour du fichier .env local
if [ -f ".env" ]; then
    if ! grep -q "ENVIRONMENT=" .env; then
        echo -e "\nENVIRONMENT=development" >> .env
        echo -e "${GREEN}[OK] Variable ENVIRONMENT ajoutee a .env${NC}"
    fi
fi

echo -e "\n${BLUE}[INFO] === MASQUAGE DE LA DOCUMENTATION TERMINE ===${NC}"
echo -e "${YELLOW}Note : En production, definissez ENVIRONMENT=production dans votre .env.${NC}"
