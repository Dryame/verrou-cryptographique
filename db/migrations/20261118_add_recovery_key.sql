ALTER TABLE cle_identite
    ADD COLUMN IF NOT EXISTS cle_pub_revoquation BYTEA;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_taille_cle_revoquation'
          AND conrelid = 'cle_identite'::regclass
    ) THEN
        ALTER TABLE cle_identite
            ADD CONSTRAINT chk_taille_cle_revoquation
            CHECK (
                cle_pub_revoquation IS NULL
                OR octet_length(cle_pub_revoquation) = 32
            );
    END IF;
END
$$;
