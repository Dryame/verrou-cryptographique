CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table 1 : Utilisateur (Profil)
CREATE TABLE IF NOT EXISTS utilisateur (
    id_utilisateur UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prenom VARCHAR(50) NOT NULL,
    sel_derivation BYTEA NOT NULL,
    argon2_memoire INTEGER NOT NULL DEFAULT 65536,
    argon2_iterations INTEGER NOT NULL DEFAULT 3,
    date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2 : Annuaire des clés publiques
CREATE TABLE IF NOT EXISTS cle_identite (
    id_cle UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    empreinte VARCHAR(64) UNIQUE NOT NULL,
    cle_pub_chiffrement BYTEA NOT NULL,
    cle_pub_signature BYTEA NOT NULL,
    statut VARCHAR(15) NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'revoquee')),
    date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_taille_cle_chiffrement CHECK (octet_length(cle_pub_chiffrement) = 32),
    CONSTRAINT chk_taille_cle_signature CHECK (octet_length(cle_pub_signature) = 32)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_annuaire_empreinte ON cle_identite (empreinte);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cle_active_unique ON cle_identite (id_utilisateur) WHERE (statut = 'active');