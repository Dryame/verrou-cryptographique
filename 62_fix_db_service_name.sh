#!/bin/bash
# ==============================================================================
# Script de correction du nom du service de base de donnees (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. DETECTION DU NOM DU SERVICE DE DB ===${NC}"
# On cherche le nom du service dans docker-compose.yml (souvent 'db' ou 'postgres')
DB_SERVICE=$(grep -E "^\s+(db|postgres|database|verrou_db):" docker-compose.yml | head -n 1 | tr -d ' :')
if [ -z "$DB_SERVICE" ]; then
    # Si on ne trouve pas, on utilise le nom du conteneur qui contient 'postgres'
    DB_SERVICE="postgres" 
fi
echo -e "Le service de base de donnees s'appelle : ${YELLOW}$DB_SERVICE${NC}"

echo -e "\n${BLUE}[INFO] === 2. MISE A JOUR DU FICHIER .ENV ===${NC}"
# On remplace l'hote 'db' par le vrai nom du service dans DATABASE_URL
sed -i "s|@db:5432|@$DB_SERVICE:5432|g" .env
echo -e "${GREEN}[OK] Le fichier .env a ete mis a jour.${NC}"
grep "DATABASE_URL" .env

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE COMPLET ===${NC}"
docker-compose down
docker-compose up -d

echo -e "${YELLOW}[ATTENTION] Attente de 8 secondes pour le demarrage...${NC}"
sleep 8

echo -e "\n${BLUE}[INFO] === 4. TEST ULTIME ===${NC}"
JSON_PAYLOAD=$(docker-compose exec -T backend python -c "
import nacl.signing
import nacl.utils
import hashlib
import os
import json

signing_key = nacl.signing.SigningKey.generate()
cle_pub_sig = bytes(signing_key.verify_key)
cle_chiff = os.urandom(32)
sel = os.urandom(16)
cle_revocation = os.urandom(32)

empreinte = hashlib.blake2b(cle_chiff + cle_pub_sig, digest_size=32).hexdigest()
message = f'VERROU-REGISTRER-V1\n{empreinte}\n{cle_revocation.hex()}'.encode('utf-8')
signature = signing_key.sign(message).signature

payload = {
    'prenom': 'Idrissa',
    'sel_derivation_hex': sel.hex(),
    'cle_pub_chiffrement_hex': cle_chiff.hex(),
    'cle_pub_signature_hex': cle_pub_sig.hex(),
    'cle_pub_revocation': cle_revocation.hex(),
    'empreinte': empreinte,
    'signature_enregistrement_hex': signature.hex(),
    'argon2_memoire': 65536,
    'argon2_iterations': 3
}
print(json.dumps(payload))
" 2>/dev/null | tail -n 1)

echo -e "Envoi de la requete..."
RESPONSE=$(curl -s -w "\nCode HTTP : %{http_code}" -X POST "http://localhost:8000/api/v1/profils" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD")
echo -e "$RESPONSE"

echo -e "\n${BLUE}[INFO] === 5. VERIFICATION EN BASE ===${NC}"
# On utilise le bon nom de service detecte
docker-compose exec -T "$DB_SERVICE" psql -U verrou_user -d verrou_db -c "SELECT prenom, empreinte FROM utilisateur JOIN cle_identite ON utilisateur.id_utilisateur = cle_identite.id_utilisateur;"

echo -e "\n${GREEN}=== FIN DU TEST ===${NC}"
