import hashlib
import hmac
import os

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Utilisateur, CleIdentite
from app.schemas import ProfilCreate, ContactResponse, RevoquerIdentiteRequest
from app.security import verifier_signature_ed25519

app = FastAPI(title="Verrou Backend API", version="1.0.0")

origines_autorisees = [
    origine.strip()
    for origine in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origine.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origines_autorisees,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

@app.get("/")
def read_root():
    return {"message": "Serveur Verrou opérationnel (Zero-Knowledge)"}

@app.post("/api/v1/profils", status_code=201)
async def creer_profil(payload: ProfilCreate, db: AsyncSession = Depends(get_db)):
    cle_sig_bytes = bytes.fromhex(payload.cle_pub_signature_hex)
    cle_chif_bytes = bytes.fromhex(payload.cle_pub_chiffrement_hex)
    cle_revoquation_bytes = bytes.fromhex(payload.cle_pub_revoquation_hex)
    sel_bytes = bytes.fromhex(payload.sel_derivation_hex)
    empreinte = payload.empreinte.lower()
    empreinte_calculee = hashlib.blake2b(cle_chif_bytes + cle_sig_bytes, digest_size=32).hexdigest()

    if not hmac.compare_digest(empreinte_calculee, empreinte):
        raise HTTPException(status_code=400, detail="L'empreinte ne correspond pas aux clés publiques.")

    message_inscription = (
        f"VERROU-REGISTER-V1\n{empreinte}\n{cle_revoquation_bytes.hex()}"
    ).encode("utf-8")
    signature_inscription = bytes.fromhex(payload.signature_enregistrement_hex)
    if not verifier_signature_ed25519(cle_sig_bytes, message_inscription, signature_inscription):
        raise HTTPException(status_code=401, detail="La preuve de possession de la clé de signature est invalide.")

    resultat_existant = await db.execute(
        select(CleIdentite).where(CleIdentite.empreinte == empreinte)
    )
    cle_existante = resultat_existant.scalar_one_or_none()
    if cle_existante:
        if (
            cle_existante.cle_pub_chiffrement != cle_chif_bytes or
            cle_existante.cle_pub_signature != cle_sig_bytes
        ):
            raise HTTPException(status_code=409, detail="Cette empreinte est déjà associée à d'autres clés.")
        if cle_existante.statut != "active":
            raise HTTPException(status_code=409, detail="Cette identité est déjà révoquée.")
        if cle_existante.cle_pub_revoquation is not None:
            if cle_existante.cle_pub_revoquation != cle_revoquation_bytes:
                raise HTTPException(status_code=409, detail="Une clé de récupération est déjà associée à cette identité.")
        else:
            cle_existante.cle_pub_revoquation = cle_revoquation_bytes
            await db.commit()
        return {"message": "Identité déjà enregistrée", "empreinte": empreinte}

    nouvel_user = Utilisateur(
        prenom=payload.prenom,
        sel_derivation=sel_bytes,
        argon2_memoire=payload.argon2_memoire,
        argon2_iterations=payload.argon2_iterations
    )
    db.add(nouvel_user)
    await db.flush()

    nouvelle_cle = CleIdentite(
        id_utilisateur=nouvel_user.id_utilisateur,
        empreinte=empreinte,
        cle_pub_chiffrement=cle_chif_bytes,
        cle_pub_signature=cle_sig_bytes,
        cle_pub_revoquation=cle_revoquation_bytes,
        statut="active"
    )
    db.add(nouvelle_cle)
    await db.commit()

    return {"message": "Identité publique enregistrée", "id_utilisateur": nouvel_user.id_utilisateur}

@app.get("/api/v1/annuaire/{empreinte}", response_model=ContactResponse)
async def chercher_contact(empreinte: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(CleIdentite, Utilisateur.prenom)
        .join(Utilisateur, CleIdentite.id_utilisateur == Utilisateur.id_utilisateur)
        .where(CleIdentite.empreinte == empreinte, CleIdentite.statut == "active")
    )
    result = await db.execute(stmt)
    ligne = result.first()
    if not ligne:
        raise HTTPException(status_code=404, detail="Contact introuvable dans l'annuaire")

    cle_obj, prenom = ligne
    return ContactResponse(
        id_utilisateur=cle_obj.id_utilisateur,
        prenom=prenom,
        empreinte=cle_obj.empreinte,
        cle_pub_chiffrement_hex=cle_obj.cle_pub_chiffrement.hex(),
        cle_pub_signature_hex=cle_obj.cle_pub_signature.hex(),
        statut=cle_obj.statut
    )


@app.post("/api/v1/annuaire/{empreinte}/revoquer")
async def revoquer_identite(
    empreinte: str,
    payload: RevoquerIdentiteRequest,
    db: AsyncSession = Depends(get_db)
):
    empreinte = empreinte.lower()
    resultat = await db.execute(
        select(CleIdentite)
        .where(CleIdentite.empreinte == empreinte)
        .with_for_update()
    )
    cle_obj = resultat.scalar_one_or_none()
    if not cle_obj:
        raise HTTPException(status_code=404, detail="Identité introuvable dans le registre.")
    if cle_obj.cle_pub_revoquation is None:
        raise HTTPException(status_code=409, detail="Cette identité ne possède pas de clé de récupération.")

    message_revoquation = f"VERROU-REVOKE-V1\n{empreinte}".encode("utf-8")
    signature = bytes.fromhex(payload.signature_hex)
    if not verifier_signature_ed25519(cle_obj.cle_pub_revoquation, message_revoquation, signature):
        raise HTTPException(status_code=403, detail="Le code de récupération n'autorise pas cette révocation.")

    cle_obj.statut = "revoquee"
    await db.commit()
    return {"message": "Identité révoquée", "empreinte": empreinte, "statut": cle_obj.statut}
