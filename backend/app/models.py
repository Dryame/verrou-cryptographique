import uuid
from datetime import datetime
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
    date_creation = Column(DateTime(timezone=True), default=datetime.utcnow)

    cles = relationship("CleIdentite", back_populates="utilisateur", cascade="all, delete-orphan")

class CleIdentite(Base):
    __tablename__ = "cle_identite"

    id_cle = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_utilisateur = Column(UUID(as_uuid=True), ForeignKey("utilisateur.id_utilisateur", ondelete="CASCADE"), nullable=False)
    empreinte = Column(String(64), unique=True, nullable=False)
    cle_pub_chiffrement = Column(LargeBinary(32), nullable=False)
    cle_pub_signature = Column(LargeBinary(32), nullable=False)
    statut = Column(String(15), nullable=False, default="active")
    date_creation = Column(DateTime(timezone=True), default=datetime.utcnow)

    utilisateur = relationship("Utilisateur", back_populates="cles")
