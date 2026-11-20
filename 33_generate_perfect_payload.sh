#!/bin/bash
# ==============================================================================
# Script pour extraire les regles Pydantic et generer le payload parfait
# ==============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === EXTRACTION DES REGLES DE VOTRE SCHEMAS.PY ===${NC}"

SCHEMA_FILE="backend/app/schemas.py"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}[ERREUR] Impossible de trouver schemas.py${NC}"
    exit 1
fi

# Affichage des champs de la classe ProfilCreate
echo -e "${YELLOW}Voici les champs exacts attendus par votre API (regardez bien les noms) :${NC}"
grep -A 15 "class ProfilCreate" "$SCHEMA_FILE" | grep ":" | grep -v "class" | sed 's/^/    /'

echo -e "\n${BLUE}[INFO] === GENERATION DU PAYLOAD PARFAIT ===${NC}"

# On genere un payload en respectant les contraintes vues sur l'image
# 64 caracteres pour les cles et empreintes, 128 pour les signatures
HEX_64="0000000000000000000000000000000000000000000000000000000000000000"
HEX_128="00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"

JSON_PAYLOAD=$(cat <<EOF
{
  "prenom": "Idrissa",
  "derivation_hex": "$HEX_64",
  "cle_pub_chiffrement_hex": "$HEX_64",
  "cle_pub_signature_hex": "$HEX_64",
  "cle_pub_revocation_hex": "$HEX_64",
  "empreinte": "$HEX_64",
  "signature_enregistrement_hex": "$HEX_128"
}
EOF
)

echo -e "Envoi du payload corrige :"
echo -e "$JSON_PAYLOAD"

curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/api/v1/profils" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD"

echo -e "\n${BLUE}[INFO] === FIN DU TEST ===${NC}"
