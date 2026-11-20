#!/bin/bash
# ==============================================================================
# Script de test final avec le bon payload (Phase 6)
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === TEST FINAL AVEC LE VRAI SCHEMA ===${NC}"

# On genere un payload avec les champs exacts exiges par Pydantic
JSON_PAYLOAD='{
  "prenom": "Idrissa",
  "derivation_hex": "0000000000000000000000000000000000000000000000000000000000000000",
  "cle_pub_chiffrement_hex": "1111111111111111111111111111111111111111111111111111111111111111",
  "cle_pub_signature_hex": "2222222222222222222222222222222222222222222222222222222222222222",
  "cle_pub_revocation_hex": "3333333333333333333333333333333333333333333333333333333333333333",
  "empreinte": "empreinte_test_123456",
  "signature_enregistrement_hex": "4444444444444444444444444444444444444444444444444444444444444444"
}'

curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/api/v1/profils" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD"

echo -e "\n${BLUE}[INFO] === FIN DU TEST ===${NC}"
