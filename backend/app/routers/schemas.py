from pydantic import BaseModel
import uuid

class ProfilCreate(BaseModel):
    prenom: str
    sel_derivation_hex: str
    cle_pub_chiffrement_hex: str
    cle_pub_signature_hex: str
    empreinte: str
    argon2_memoire: int = 65536
    argon2_iterations: int = 3

class ContactResponse(BaseModel):
    id_utilisateur: uuid.UUID
    prenom: str
    empreinte: str
    cle_pub_chiffrement_hex: str
    cle_pub_signature_hex: str
    statut: str

    class Config:
        from_attributes = True