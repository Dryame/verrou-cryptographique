import os
import hashlib
import hmac
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import nacl.signing
from nacl.exceptions import BadSignatureError
from sqlalchemy.orm import selectinload

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
        cle_revocation_bytes = bytes.fromhex(payload.cle_pub_revoquation_hex)
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
        f"VERROU-REGISTER-V1\n{empreinte}\n{cle_revocation_bytes.hex()}"
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
        cle_pub_revoquation=cle_revocation_bytes
    )
    db.add(nouvelle_cle)
    await db.commit()

    return ContactResponse(prenom=nouvel_utilisateur.prenom, empreinte=nouvelle_cle.empreinte, cle_pub_chiffrement_hex=cle_chiff_bytes.hex(), cle_pub_signature_hex=cle_sig_bytes.hex(), statut="active")

@app.get("/api/v1/annuaire/{empreinte}", response_model=ContactResponse)
async def obtenir_profil(empreinte: str, db: AsyncSession = Depends(get_db)):
    # ON AJOUTE .options(selectinload(CleIdentite.utilisateur))
    resultat = await db.execute(
        select(CleIdentite)
        .options(selectinload(CleIdentite.utilisateur))
        .where(CleIdentite.empreinte == empreinte)
    )
    cle = resultat.scalar_one_or_none()
    if not cle:
        raise HTTPException(status_code=404, detail="Profil introuvable.")
    return ContactResponse(
        prenom=cle.utilisateur.prenom, 
        empreinte=cle.empreinte, 
        cle_pub_chiffrement_hex=cle.cle_pub_chiffrement.hex(), 
        cle_pub_signature_hex=cle.cle_pub_signature.hex(), 
        statut=cle.statut
    )

@app.post("/api/v1/annuaire/{empreinte}/revoquer")
async def revoquer_identite(empreinte: str, payload: RevoquerIdentiteRequest, db: AsyncSession = Depends(get_db)):
    resultat = await db.execute(select(CleIdentite).where(CleIdentite.empreinte == empreinte))
    cle = resultat.scalar_one_or_none()
    
    if not cle:
        raise HTTPException(status_code=404, detail="Profil introuvable.")
    if cle.statut == 'revoquee':
        raise HTTPException(status_code=400, detail="Cette identité est déjà révoquée.")
    
    # Attention : l'indentation doit être de 4 espaces à l'intérieur de la fonction
    message = f"VERROU-REVOKE-V1\n{empreinte.lower()}".encode('utf-8')
    signature = bytes.fromhex(payload.signature_hex)
    
    try:
        verify_key = nacl.signing.VerifyKey(cle.cle_pub_revoquation)
        verify_key.verify(message, signature)
    except BadSignatureError:
        raise HTTPException(status_code=401, detail="Signature de révocation invalide.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de vérification: {str(e)}")
    
    cle.statut = 'revoquee'
    await db.commit()
    return {"message": "Identité révoquée avec succès."}