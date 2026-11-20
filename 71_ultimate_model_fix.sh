#!/bin/bash
# ==============================================================================
# Script de reecriture propre de models.py (Phase 6)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. ECRITURE PROPRE DE MODELS.PY ===${NC}"

# On ecrit un modele parfait en ASCII pur
cat << 'EOF' > backend/app/models.py
import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Utilisateur(Base):
    __tablename__ = "utilisateur"

    id_utilisateur = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prenom = Column(String(50), nullable=False)
    sel_derivation = Column(LargeBinary, nullable=False)
    argon2_memoire = Column(Integer, nullable=False, default=65536)
    argon2_iterations = Column(Integer, nullable=False, default=3)
    date_creation = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    cles = relationship("CleIdentite", back_populates="utilisateur", cascade="all, delete-orphan")

class CleIdentite(Base):
    __tablename__ = "cle_identite"

    id_cle = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_utilisateur = Column(UUID(as_uuid=True), ForeignKey("utilisateur.id_utilisateur", ondelete="CASCADE"), nullable=False)
    empreinte = Column(String(64), unique=True, nullable=False)
    cle_pub_chiffrement = Column(LargeBinary(32), nullable=False)
    cle_pub_signature = Column(LargeBinary(32), nullable=False)
    cle_pub_revocation = Column(LargeBinary(32), nullable=True)
    statut = Column(String(15), nullable=False, default="active")
    date_creation = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    utilisateur = relationship("Utilisateur", back_populates="cles")
EOF

echo -e "${GREEN}[OK] models.py reecrit en ASCII pur.${NC}"

echo -e "\n${BLUE}[INFO] === 2. COPIE ET NETTOYAGE DU CACHE DANS DOCKER ===${NC}"
docker cp backend/app/models.py verrou_backend:/app/app/models.py
docker cp backend/app/main.py verrou_backend:/app/app/main.py
docker-compose exec -T backend find /app -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE COMPLET ===${NC}"
docker-compose restart backend
sleep 4

echo -e "\n${BLUE}[INFO] === 4. VERIFICATION DES ATTRIBUTS EN MEMOIRE ===${NC}"
# On demande a Python de lister les attributs de la classe
docker-compose exec -T backend python -c "
from app.models import CleIdentite
print('Attributs de CleIdentite :', [c.name for c in CleIdentite.__table__.columns])
"

echo -e "\n${BLUE}[INFO] === 5. TEST ULTIME ===${NC}"
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

echo -e "\n${BLUE}[INFO] === 6. VERIFICATION EN BASE ===${NC}"
docker-compose exec -T postgres psql -U verrou_user -d verrou_db -c "SELECT prenom, empreinte FROM utilisateur JOIN cle_identite ON utilisateur.id_utilisateur = cle_identite.id_utilisateur;"

echo -e "\n${GREEN}=== FIN DU TEST ===${NC}"
