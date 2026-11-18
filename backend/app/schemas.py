from pydantic import BaseModel
from pydantic import Field, field_validator
import uuid

class ProfilCreate(BaseModel):
    prenom: str = Field(min_length=1, max_length=50)
    sel_derivation_hex: str = Field(pattern=r"^[0-9a-fA-F]{32}$")
    cle_pub_chiffrement_hex: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    cle_pub_signature_hex: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    cle_pub_revoquation_hex: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    empreinte: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    signature_enregistrement_hex: str = Field(pattern=r"^[0-9a-fA-F]{128}$")
    argon2_memoire: int = 65536
    argon2_iterations: int = 3

    @field_validator("prenom")
    @classmethod
    def nettoyer_prenom(cls, value: str) -> str:
        prenom = value.strip()
        if not prenom:
            raise ValueError("Le nom d'identité ne peut pas être vide.")
        return prenom


class RevoquerIdentiteRequest(BaseModel):
    signature_hex: str = Field(pattern=r"^[0-9a-fA-F]{128}$")


class ContactResponse(BaseModel):
    id_utilisateur: uuid.UUID
    prenom: str
    empreinte: str
    cle_pub_chiffrement_hex: str
    cle_pub_signature_hex: str
    statut: str

    class Config:
        from_attributes = True
