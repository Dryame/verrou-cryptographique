#!/bin/bash
# ==============================================================================
# Script de correction Pydantic et Docker Ports (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. CORRECTION DE PYDANTIC (SCHEMAS) ===${NC}"

# Utilisation de Python pour nettoyer proprement les classes Config dans schemas.py
python3 - << 'EOF'
import re

file_path = "backend/app/schemas.py"
try:
    with open(file_path, "r") as f:
        content = f.read()

    # On supprime les blocs "class Config:" (et leur contenu indenté)
    # jusqu'à ce qu'on rencontre une nouvelle classe ou la fin du fichier
    content = re.sub(r"    class Config:\n(        .*\n)+", "", content)
    
    with open(file_path, "w") as f:
        f.write(content)
    print("[OK] Blocs 'class Config:' supprimes de schemas.py")
except FileNotFoundError:
    print("[ERREUR] Fichier schemas.py introuvable.")
EOF

echo -e "\n${BLUE}[INFO] === 2. EXPOSITION DU PORT 8000 DANS DOCKER ===${NC}"

# On ajoute le mapping de port 8000:8000 pour le backend s'il n'existe pas
if grep -q "ports:" docker-compose.yml; then
    echo -e "${GREEN}[OK] La section 'ports' existe deja dans docker-compose.yml.${NC}"
else
    # Ajout du port sous le service backend
    sed -i '/backend:/,/depends_on:/ s/    depends_on:/    ports:\n      - "8000:8000"\n    depends_on:/' docker-compose.yml
    echo -e "${GREEN}[OK] Port 8000 ajoute dans docker-compose.yml.${NC}"
fi

# Nettoyage de l'avertissement de version
sed -i '/^version:/d' docker-compose.yml

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE ===${NC}"
docker-compose down -v
docker-compose up -d --build

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes...${NC}"
sleep 10

# Verification
echo -e "\n${BLUE}[INFO] Verification de l'etat du backend...${NC}"
if docker-compose ps | grep -q "backend.*Up"; then
    echo -e "${GREEN}[OK] Le backend est en cours d'execution.${NC}"
    
    echo -e "\n${BLUE}[INFO] === TEST DE LA ROUTE ===${NC}"
    curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/profils" \
         -H "Content-Type: application/json" \
         -d '{"username": "test_debug", "public_key": "dGVzdF9rZXk="}'
else
    echo -e "${RED}[ERREUR] Le backend n'a pas demarre.${NC}"
    docker-compose logs --tail=20 backend
    exit 1
fi

echo -e "\n${GREEN}=== TERMINE ===${NC}"
