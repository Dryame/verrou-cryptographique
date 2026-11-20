#!/bin/bash
# ==============================================================================
# Script de reinitialisation de la base de donnees (Phase 6)
# Ce script detruit le volume PostgreSQL pour appliquer le nouveau mot de passe.
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === REINITIALISATION DE LA BASE DE DONNEES ===${NC}"
echo -e "Cette operation va supprimer la base de donnees actuelle et en recreer une neuve."
echo -e "Le nouveau mot de passe sera applique."

# ==============================================================================
# 1. Arret des conteneurs et suppression des volumes (-v)
# ==============================================================================
echo -e "\n${YELLOW}[ATTENTION] Arret des conteneurs et suppression du volume...${NC}"
docker-compose down -v

# ==============================================================================
# 2. Verification de la coherence du fichier .env
# ==============================================================================
echo -e "\n${BLUE}[INFO] Verification du fichier .env...${NC}"

if [ ! -f .env ]; then
    echo -e "${RED}[ERREUR] Le fichier .env est introuvable.${NC}"
    exit 1
fi

DB_USER=$(grep "^POSTGRES_USER=" .env | cut -d '=' -f2)
DB_PASS=$(grep "^POSTGRES_PASSWORD=" .env | cut -d '=' -f2)
DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2)

echo -e "Utilisateur : ${YELLOW}$DB_USER${NC}"
echo -e "Nouveau mot de passe : ${YELLOW}$DB_PASS${NC}"

# On verifie que le mot de passe est bien present dans l'URL de connexion
if [[ "$DB_URL" != *"$DB_PASS"* ]]; then
    echo -e "${RED}[ERREUR] Incoherence detectee dans le fichier .env !${NC}"
    echo -e "Le mot de passe de POSTGRES_PASSWORD ne correspond pas a celui dans DATABASE_URL."
    echo -e "Veuillez corriger le fichier .env avant de relancer ce script."
    exit 1
fi
echo -e "${GREEN}[OK] Les identifiants dans le fichier .env sont coherents.${NC}"

# ==============================================================================
# 3. Redemarrage propre avec le nouveau mot de passe
# ==============================================================================
echo -e "\n${BLUE}[INFO] === REDEMARRAGE DES CONTENEURS ===${NC}"
docker-compose up -d --build

echo -e "${YELLOW}[ATTENTION] Attente de 10 secondes pour l'initialisation de PostgreSQL...${NC}"
sleep 10

# ==============================================================================
# 4. Verification que le backend a bien demarre
# ==============================================================================
echo -e "\n${BLUE}[INFO] Verification des logs du backend...${NC}"
if docker-compose logs backend | grep -q "InvalidPasswordError"; then
    echo -e "${RED}[ERREUR] L'erreur d'authentification persiste.${NC}"
    echo -e "Verifiez que votre DATABASE_URL utilise bien le nom du service docker 'db'."
    exit 1
else
    echo -e "${GREEN}[OK] Le backend a demarre sans erreur d'authentification.${NC}"
fi

echo -e "\n${GREEN}=== REINITIALISATION TERMINEE AVEC SUCCES ===${NC}"
echo -e "Vous pouvez maintenant relancer le test d'integration : ./08_test_integration.sh"
