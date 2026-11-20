from sqlalchemy import text

from app.database import engine


async def main() -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text(
                "ALTER TABLE cle_identite "
                "ADD COLUMN IF NOT EXISTS cle_pub_revoquation BYTEA"
            )
        )
        await connection.execute(
            text("""
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
            $$
        """)
        )
    await engine.dispose()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
