#!/bin/bash
# ==============================================================================
# Script de configuration du mot de passe personnalise
# Ce script configure le mot de passe 'yamess' et reinitialise la base.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === CONFIGURATION DU MOT DE PASSE PERSONNALISE ===${NC}"

# ==============================================================================
# 1. Sauvegarde de l'ancien fichier .env
# ==============================================================================
if [ -f .env ]; then
    cp .env .env.bak
    echo -e "${YELLOW}[ATTENTION] L'ancien fichier .env a ete sauvegarde sous .env.bak${NC}"
fi

# ==============================================================================
# 2. Ecriture du fichier .env avec le mot de passe 'yamess'
# ==============================================================================
echo -e "${GREEN}[OK] Mise a jour du fichier .env...${NC}"

DB_USER="verrou_user"
DB_PASS="yamess"
DB_NAME="verrou_db"
SECRET_KEY=$(openssl rand -hex 32)

cat << EOF > .env
# Fichier de configuration local (NE PAS COMMITER)
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_DB=$DB_NAME
DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@db:5432/$DB_NAME
FRONTEND_URL=http://localhost:5173
SECRET_KEY=$SECRET_KEY
ENVIRONMENT=development
EOF

echo -e "${GREEN}[OK] Fichier .env configure avec le mot de passe : $DB_PASS${NC}"

# ==============================================================================
# 3. Arret et suppression du volume de la base de donnees
# ==============================================================================
echo -e "\n${BLUE}[INFO] Nettoyage de la base de donnees pour appliquer le mot de passe...${NC}"
docker-compose down -v

# ==============================================================================
# 4. Redemarrage propre
# ==============================================================================
echo -e "\n${BLUE}[INFO] Redemarrage des conteneurs...${NC}"
docker-compose up -d --build

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour l'initialisation de PostgreSQL...${NC}"
sleep 10

# ==============================================================================
# 5. Verification des logs
# ==============================================================================
echo -e "\n${BLUE}[INFO] Verification des logs du backend...${NC}"
if docker-compose logs backend | grep -q "InvalidPasswordError"; then
    echo -e "${RED}[ERREUR] L'erreur d'authentification persiste.${NC}"
    exit 1
else
    echo -e "${GREEN}[OK] Le backend a demarre sans erreur d'authentification.${NC}"
fi

echo -e "\n${GREEN}=== CONFIGURATION TERMINEE AVEC SUCCES ===${NC}"
echo -e "Vous pouvez maintenant relancer le test d'integration : ./08_test_integration.sh"
