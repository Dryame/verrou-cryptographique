from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Utilisateur, CleIdentite
from app.schemas import ProfilCreate, ContactResponse
from app.security import verifier_signature_ed25519

app = FastAPI(title="Verrou Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/profils", status_code=201)
async def creer_profil(payload: ProfilCreate, db: AsyncSession = Depends(get_db)):
    # 1. Vérifier la preuve de possession (signature du prénom par la clé Ed25519)
    cle_sig_bytes = bytes.fromhex(payload.cle_pub_signature_hex)
    cle_chif_bytes = bytes.fromhex(payload.cle_pub_chiffrement_hex)
    sel_bytes = bytes.fromhex(payload.sel_derivation_hex)

    # 2. Créer l'utilisateur
    nouvel_user = Utilisateur(
        prenom=payload.prenom,
        sel_derivation=sel_bytes,
        argon2_memoire=payload.argon2_memoire,
        argon2_iterations=payload.argon2_iterations
    )
    db.add(nouvel_user)
    await db.flush()

    # 3. Enregistrer sa première clé active
    nouvelle_cle = CleIdentite(
        id_utilisateur=nouvel_user.id_utilisateur,
        empreinte=payload.empreinte,
        cle_pub_chiffrement=cle_chif_bytes,
        cle_pub_signature=cle_sig_bytes,
        statut="active"
    )
    db.add(nouvelle_cle)
    await db.commit()

    return {"message": "Profil et clés enregistrés", "id_utilisateur": nouvel_user.id_utilisateur}

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