#!/bin/bash
# ==============================================================================
# Script de synchronisation forcee (Phase 6 - Option Nucleaire)
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}[INFO] === 1. ECRITURE LOCALE DES FICHIERS PARFAITS ===${NC}"

# On cree un schemas.py propre
cat << 'EOF' > backend/app/schemas.py
from pydantic import BaseModel, ConfigDict, Field, field_validator

class ProfilCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    prenom: str = Field(min_length=1, max_length=50)
    sel_derivation_hex: str = Field(pattern=r"^[0-9a-fA-F]{32}$")
    cle_pub_chiffrement_hex: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    cle_pub_signature_hex: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    cle_pub_revocation: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    empreinte: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    signature_enregistrement_hex: str = Field(pattern=r"^[0-9a-fA-F]{128}$")
    argon2_memoire: int = 65536
    argon2_iterations: int = 3

    @field_validator("prenom")
    @classmethod
    def nettoyer_prenom(cls, value: str) -> str:
        prenom = value.strip()
        if not prenom:
            raise ValueError("Le nom d'identite ne peut pas etre vide.")
        return prenom

class ContactResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    prenom: str
    empreinte: str

class RevoquerIdentiteRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    signature_hex: str = Field(pattern=r"^[0-9a-fA-F]{128}$")
EOF

# On cree un main.py propre (avec le bon nom de champ)
# On garde le reste de votre logique (base de donnees, signatures)
# ATTENTION : On suppose que le nom de la table est 'cle_identite'
cat << 'EOF' > backend/app/main.py
import os
import hashlib
import hmac
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import nacl.signing
from nacl.exceptions import BadSignatureError

from app.database import get_db
from app.models import Utilisateur, CleIdentite
from app.schemas import ProfilCreate, ContactResponse, RevoquerIdentiteRequest
from app.security_middleware import setup_security

app = FastAPI()
setup_security(app)

@app.post("/api/v1/profils", response_model=ContactResponse)
async def creer_profil(payload: ProfilCreate, db: AsyncSession = Depends(get_db)):
    # --- 1. Verification cryptographique (Cle_pub) ---
    try:
        cle_sig_bytes = bytes.fromhex(payload.cle_pub_signature_hex)
        cle_chiff_bytes = bytes.fromhex(payload.cle_pub_chiffrement_hex)
        cle_revocation_bytes = bytes.fromhex(payload.cle_pub_revocation)
        sel_bytes = bytes.fromhex(payload.sel_derivation_hex)
        signature_inscription = bytes.fromhex(payload.signature_enregistrement_hex)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Format hexadecimal invalide: {str(e)}")

    # Verification de l'empreinte (BLAKE2b)
    empreinte = payload.empreinte.lower()
    empreinte_calculee = hashlib.blake2b(cle_chiff_bytes + cle_sig_bytes, digest_size=32).hexdigest()

    if not hmac.compare_digest(empreinte_calculee, empreinte):
        raise HTTPException(status_code=400, detail="L'empreinte ne correspond pas aux cles publiques.")

    # Verification de la signature Ed25519
    message_inscription = (
        f"VERROU-REGISTRER-V1\n{empreinte}\n{cle_revocation_bytes.hex()}"
    ).encode('utf-8')
    
    try:
        verify_key = nacl.signing.VerifyKey(cle_sig_bytes)
        verify_key.verify(message_inscription, signature_inscription)
    except BadSignatureError:
        raise HTTPException(status_code=401, detail="La preuve de possession de la cle de signature est invalide.")

    # --- 2. Verification en Base de Donnees ---
    resultat_existant = await db.execute(
        select(CleIdentite).where(CleIdentite.empreinte == empreinte)
    )
    cle_existante = resultat_existant.scalar_one_or_none()
    
    if cle_existante:
        if (cle_existante.cle_pub_chiffrement != cle_chiff_bytes or
            cle_existante.cle_pub_signature != cle_sig_bytes):
            raise HTTPException(status_code=409, detail="Cette empreinte est deja associee a d'autres cles.")
        
        # Si les cles correspondent, on renvoie le profil existant
        return ContactResponse(prenom=cle_existante.utilisateur.prenom, empreinte=cle_existante.empreinte)

    # --- 3. Insertion en Base de Donnees ---
    # Creation de l'utilisateur
    nouvel_utilisateur = Utilisateur(
        prenom=payload.prenom,
        sel_derivation=sel_bytes,
        argon2_memoire=payload.argon2_memoire,
        argon2_iterations=payload.argon2_iterations
    )
    db.add(nouvel_utilisateur)
    await db.flush() # Pour obtenir l'ID

    # Creation de la cle
    nouvelle_cle = CleIdentite(
        id_utilisateur=nouvel_utilisateur.id_utilisateur,
        empreinte=empreinte,
        cle_pub_chiffrement=cle_chiff_bytes,
        cle_pub_signature=cle_sig_bytes,
        cle_pub_revocation=cle_revocation_bytes
    )
    db.add(nouvelle_cle)
    await db.commit()

    return ContactResponse(prenom=nouvel_utilisateur.prenom, empreinte=nouvelle_cle.empreinte)

@app.get("/api/v1/annuaire/{empreinte}", response_model=ContactResponse)
async def obtenir_profil(empreinte: str, db: AsyncSession = Depends(get_db)):
    resultat = await db.execute(
        select(CleIdentite).where(CleIdentite.empreinte == empreinte)
    )
    cle = resultat.scalar_one_or_none()
    if not cle:
        raise HTTPException(status_code=404, detail="Profil introuvable.")
    return ContactResponse(prenom=cle.utilisateur.prenom, empreinte=cle.empreinte)

@app.post("/api/v1/annuaire/{empreinte}/revoquer")
async def revoquer_identite(empreinte: str, payload: RevoquerIdentiteRequest, db: AsyncSession = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Non implemente pour le test.")
EOF

echo -e "${GREEN}[OK] Fichiers locaux ecrits avec succes.${NC}"

echo -e "\n${BLUE}[INFO] === 2. COPIE DIRECTE DANS DOCKER (docker cp) ===${NC}"
# On force la copie des fichiers a l'interieur du conteneur
docker cp backend/app/main.py verrou_backend:/app/app/main.py
docker cp backend/app/schemas.py verrou_backend:/app/app/schemas.py
echo -e "${GREEN}[OK] Fichiers copies directement dans le conteneur.${NC}"

echo -e "\n${BLUE}[INFO] === 3. REDEMARRAGE DU CONTENEUR ===${NC}"
docker-compose restart backend
sleep 5

echo -e "\n${BLUE}[INFO] === 4. VERIFICATION (Ce que Docker voit) ===${NC}"
docker-compose exec -T backend grep "cle_revocation_bytes =" app/main.py

echo -e "\n${BLUE}[INFO] === 5. TEST ULTIME ===${NC}"

H32="11111111111111111111111111111111"
H64="2222222222222222222222222222222222222222222222222222222222222222"
H128="33333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333"

JSON_PAYLOAD=$(cat <<EOF
{
  "prenom": "Idrissa",
  "sel_derivation_hex": "$H32",
  "cle_pub_chiffrement_hex": "$H64",
  "cle_pub_signature_hex": "$H64",
  "cle_pub_revocation": "$H64",
  "empreinte": "$H64",
  "signature_enregistrement_hex": "$H128",
  "argon2_memoire": 65536,
  "argon2_iterations": 3
}
EOF
)

curl -s -w "\nCode HTTP : %{http_code}\n" -X POST "http://localhost:8000/api/v1/profils" \
     -H "Content-Type: application/json" \
     -d "$JSON_PAYLOAD"

echo -e "\n${GREEN}=== FIN DU TEST ===${NC}"
