#!/bin/bash
# ==============================================================================
# Script de test ultime de succes (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === GENERATION DES CLES ET ENVOI DU VRAI TEST ===${NC}"

JSON_PAYLOAD=$(docker-compose exec -T backend python -c "
import nacl.signing
import nacl.utils
import hashlib
import os
import json

# Generation de vraies cles cryptographiques
signing_key = nacl.signing.SigningKey.generate()
cle_pub_sig = bytes(signing_key.verify_key)
cle_chiff = os.urandom(32)
sel = os.urandom(16)
cle_revocation = os.urandom(32)

# Calcul de l'empreinte
empreinte = hashlib.blake2b(cle_chiff + cle_pub_sig, digest_size=32).hexdigest()

# Signature du message
message = f'VERROU-REGISTRER-V1\n{empreinte}\n{cle_revocation.hex()}'.encode('utf-8')
signature = signing_key.sign(message).signature

# Construction du payload JSON avec le nom de champ correct
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

echo -e "${GREEN}[OK] Payload genere avec succes.${NC}"
echo -e "Envoi de la requete POST..."

# Envoi de la requete
RESPONSE=$(curl -s -w "\nCode HTTP : %{http_code}" -X POST "http://localhost:8000/api/v1/profils" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD")
echo -e "$RESPONSE"

echo -e "\n${BLUE}[INFO] === VERIFICATION DANS POSTGRESQL ===${NC}"
# Requete SQL pour voir si l'utilisateur a bien ete cree
docker-compose exec -T postgres psql -U verrou_user -d verrou_db -c "SELECT prenom, empreinte FROM utilisateur JOIN cle_identite ON utilisateur.id_utilisateur = cle_identite.id_utilisateur;"

echo -e "\n${GREEN}=== FIN DU TEST ===${NC}"
