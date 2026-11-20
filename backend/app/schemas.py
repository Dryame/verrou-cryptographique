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
