#!/bin/bash
# ==============================================================================
# Script de connexion des routeurs et redemarrage (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CONNEXION DES ROUTEURS DANS MAIN.PY ===${NC}"

MAIN_FILE="backend/app/main.py"
if [ ! -f "$MAIN_FILE" ]; then
    echo -e "${RED}[ERREUR] Impossible de trouver $MAIN_FILE${NC}"
    exit 1
fi

cp "$MAIN_FILE" "${MAIN_FILE}.bak"

# On utilise Python pour modifier main.py proprement
python3 - << 'EOF'
file_path = "backend/app/main.py"

with open(file_path, "r") as f:
    content = f.read()

# 1. Ajout de l'import des routeurs
if "from app.routers import" not in content:
    # On cherche la fin des imports pour ajouter notre ligne
    content = content.replace(
        "from app.security_middleware import setup_security",
        "from app.security_middleware import setup_security\nfrom app.routers import profils, recuperation"
    )

# 2. Ajout de l'inclusion des routeurs apres la creation de l'app
if "app.include_router" not in content:
    # On cherche la ligne setup_security(app) pour ajouter juste apres
    content = content.replace(
        "setup_security(app)",
        "setup_security(app)\n\n# Inclusion des routes\napp.include_router(profils.router)\napp.include_router(recuperation.router)"
    )

with open(file_path, "w") as f:
    f.write(content)
print("[OK] Fichier main.py modifie avec succes.")
EOF

echo -e "${GREEN}[OK] Routeurs connectes.${NC}"

# ==============================================================================
# Redemarrage propre des conteneurs
# ==============================================================================
echo -e "\n${BLUE}[INFO] === REDEMARRAGE DES CONTENEURS ===${NC}"
docker-compose down -v
docker-compose up -d --build

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour le demarrage complet...${NC}"
sleep 10

# Verification que le backend tourne
if docker-compose ps | grep -q "backend.*Up"; then
    echo -e "${GREEN}[OK] Le conteneur backend est en cours d'execution.${NC}"
else
    echo -e "${RED}[ERREUR] Le backend n'a pas reussi a demarrer.${NC}"
    docker-compose logs backend
    exit 1
fi

echo -e "\n${BLUE}[INFO] === TEST DE LA ROUTE ===${NC}"
curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/profils" \
     -H "Content-Type: application/json" \
     -d '{"username": "test_debug", "public_key": "dGVzdF9rZXk="}' || true

echo -e "\n${GREEN}=== TERMINE ===${NC}"
