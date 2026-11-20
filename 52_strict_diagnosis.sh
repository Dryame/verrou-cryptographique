#!/bin/bash
# ==============================================================================
# Script de diagnostic strict de l'erreur 500 (Phase 6 - Production Ready)
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. EXTRACTION DE L'ERREUR FATALE (TRACEBACK) ===${NC}"
# On cherche specifiquement le mot "Error" dans les logs pour voir la ligne exacte
docker-compose logs --tail=50 backend | grep -A 10 "Error" || echo -e "${YELLOW}Aucune erreur 'Error' trouvee. Voici les 20 dernieres lignes brutes :${NC}"
docker-compose logs --tail=20 backend

echo -e "\n${BLUE}[INFO] === 2. INSPECTION DU CODE DE LA ROUTE ===${NC}"
echo -e "Voici le code qui s'execute quand vous appelez /profils :"
# On affiche la fonction creer_profil dans main.py
grep -A 25 "async def creer_profil" backend/app/main.py

echo -e "\n${BLUE}[INFO] === 3. VERIFICATION DU SCHEMA ===${NC}"
echo -e "Verification de la classe ProfilCreate :"
grep -A 15 "class ProfilCreate" backend/app/schemas.py

echo -e "\n${GREEN}=== FIN DU DIAGNOSTIC ===${NC}"
