
from pydantic import BaseModel, Field


class ProfilCreate(BaseModel):
    prenom: str = Field(..., min_length=1, max_length=50)
    sel_derivation_hex: str = Field(..., min_length=32, max_length=64)
    cle_pub_chiffrement_hex: str = Field(..., min_length=64, max_length=64)
    cle_pub_signature_hex: str = Field(..., min_length=64, max_length=64)
    cle_pub_revoquation_hex: str = Field(..., min_length=64, max_length=64)
    empreinte: str = Field(..., min_length=64, max_length=64)
    signature_enregistrement_hex: str = Field(..., min_length=128, max_length=128)
    argon2_memoire: int | None = 65536
    argon2_iterations: int | None = 3


class ContactResponse(BaseModel):
    prenom: str
    empreinte: str
    cle_pub_chiffrement_hex: str
    cle_pub_signature_hex: str
    statut: str = "active"


class RevoquerIdentiteRequest(BaseModel):
    signature_hex: str = Field(..., min_length=128, max_length=128)
