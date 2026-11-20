#!/usr/bin/env bash
set -e

API_URL="${API_URL:-http://localhost:8000}"
echo "🚀 Démarrage du test d'intégration sur $API_URL"

python3 - "$API_URL" << 'PYEOF'
import sys
import os
import hashlib
import json
import requests
import nacl.signing
import nacl.encoding
from nacl.public import PrivateKey

API_URL = sys.argv[1]

def print_step(msg):
    print(f"\n--- {msg} ---")

# 1. Génération des clés
print_step("1. Génération des clés cryptographiques")
box_priv = PrivateKey.generate()
box_pub = box_priv.public_key
sign_priv = nacl.signing.SigningKey.generate()
sign_pub = sign_priv.verify_key
revoke_priv = nacl.signing.SigningKey.generate()
revoke_pub = revoke_priv.verify_key

box_pub_hex = box_pub.encode().hex()
sign_pub_hex = sign_pub.encode().hex()
revoke_pub_hex = revoke_pub.encode().hex()

# 2. Calcul de l'empreinte
print_step("2. Calcul de l'empreinte BLAKE2b")
empreinte = hashlib.blake2b(bytes.fromhex(box_pub_hex) + bytes.fromhex(sign_pub_hex), digest_size=32).hexdigest()
print(f"Empreinte : {empreinte}")

# 3. Enregistrement
print_step("3. Enregistrement du profil")
msg_reg = f"VERROU-REGISTER-V1\n{empreinte}\n{revoke_pub_hex}".encode('utf-8')
sig_reg = sign_priv.sign(msg_reg).signature.hex()

payload = {
    "prenom": "AliceTest",
    "sel_derivation_hex": os.urandom(16).hex(),
    "cle_pub_chiffrement_hex": box_pub_hex,
    "cle_pub_signature_hex": sign_pub_hex,
    "cle_pub_revoquation_hex": revoke_pub_hex,
    "empreinte": empreinte,
    "signature_enregistrement_hex": sig_reg
}

try:
    res = requests.post(f"{API_URL}/api/v1/profils", json=payload)
    res.raise_for_status()
    print("✅ Profil créé avec succès :", res.json())
except Exception as e:
    print("❌ Échec :", res.text if 'res' in locals() else str(e))
    sys.exit(1)

# 4. Vérification
print_step("4. Vérification dans l'annuaire")
try:
    res = requests.get(f"{API_URL}/api/v1/annuaire/{empreinte}")
    res.raise_for_status()
    data = res.json()
    assert data["empreinte"] == empreinte
    assert data["cle_pub_chiffrement_hex"] == box_pub_hex
    assert data["statut"] == "active"
    print("✅ Profil trouvé et clés vérifiées :", data)
except Exception as e:
    print("❌ Échec :", res.text if 'res' in locals() else str(e))
    sys.exit(1)

# 5. Révocation
print_step("5. Révocation de l'identité")
msg_rev = f"VERROU-REVOKE-V1\n{empreinte.lower()}".encode('utf-8')
sig_rev = revoke_priv.sign(msg_rev).signature.hex()

try:
    res = requests.post(f"{API_URL}/api/v1/annuaire/{empreinte}/revoquer", json={"signature_hex": sig_rev})
    res.raise_for_status()
    print("✅ Révocation réussie :", res.json())
except Exception as e:
    print("❌ Échec :", res.text if 'res' in locals() else str(e))
    sys.exit(1)

# 6. Vérification post-révocation
print_step("6. Vérification post-révocation")
try:
    res = requests.get(f"{API_URL}/api/v1/annuaire/{empreinte}")
    res.raise_for_status()
    data = res.json()
    assert data["statut"] == "revoquee"
    print("✅ Statut correctement mis à jour à 'revoquee'")
except Exception as e:
    print("❌ Échec :", res.text if 'res' in locals() else str(e))
    sys.exit(1)

print("\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! 🎉")
PYEOF
