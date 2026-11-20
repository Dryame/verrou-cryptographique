#!/bin/bash
# ==============================================================================
# Script d'alignement du modele de base de donnees (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. INSPECTION DU MODELE CLEIDENTITE ===${NC}"
# On regarde comment la colonne est nommee dans models.py
grep -A 10 "class CleIdentite" backend/app/models.py | grep "revocation"

echo -e "\n${BLUE}[INFO] === 2. CORRECTION DE MAIN.PY ===${NC}"
python3 - << 'EOF'
import re

filepath = "backend/app/main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# On remplace l'argument du constructeur CleIdentite pour qu'il corresponde au modele
# Si le modele utilise "cle_pub_revocation_hex", on met a jour main.py
if "cle_pub_revocation_hex = Column" in open("backend/app/models.py", encoding="utf-8").read():
    content = content.replace("cle_pub_revocation=cle_revocation_bytes", "cle_pub_revocation_hex=cle_revocation_bytes")
    print("[OK] main.py aligne sur le modele : utilisation de cle_pub_revocation_hex.")
elif "cle_revocation = Column" in open("backend/app/models.py", encoding="utf-8").read():
    content = content.replace("cle_pub_revocation=cle_revocation_bytes", "cle_revocation=cle_revocation_bytes")
    print("[OK] main.py aligne sur le modele : utilisation de cle_revocation.")
else:
    # Si la colonne s'appelle bien cle_pub_revocation, alors le probleme est ailleurs
    # (peut-etre que models.py n'a pas ete mis a jour)
    print("[ATTENTION] La colonne s'appelle 'cle_pub_revocation' dans models.py, mais l'erreur persiste.")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
EOF

# On s'assure que le fichier est bien dans le conteneur
docker cp backend/app/main.py verrou_backend:/app/app/main.py

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE DU CONTENEUR ===${NC}"
docker-compose restart backend
sleep 3

echo -e "\n${BLUE}[INFO] === 4. TEST ULTIME AVEC CLES CRYPTOGRAPHIQUES ===${NC}"
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

RESPONSE=$(curl -s -w "\nCode HTTP : %{http_code}" -X POST "http://localhost:8000/api/v1/profils" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD")
echo -e "$RESPONSE"

echo -e "\n${BLUE}[INFO] === 5. VERIFICATION EN BASE ===${NC}"
docker-compose exec -T postgres psql -U verrou_user -d verrou_db -c "SELECT prenom, empreinte FROM utilisateur JOIN cle_identite ON utilisateur.id_utilisateur = cle_identite.id_utilisateur;"

echo -e "\n${GREEN}=== FIN DU TEST ===${NC}"
