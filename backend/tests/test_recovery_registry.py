import os
import unittest
from types import SimpleNamespace

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")

from fastapi import HTTPException
from nacl.signing import SigningKey

from app.main import revoquer_identite
from app.schemas import RevoquerIdentiteRequest


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeDatabase:
    def __init__(self, identity):
        self.identity = identity
        self.committed = False

    async def execute(self, _statement):
        return FakeResult(self.identity)

    async def commit(self):
        self.committed = True


class RecoveryRegistryTests(unittest.IsolatedAsyncioTestCase):
    async def test_valid_recovery_signature_revokes_identity(self):
        empreinte = "a" * 64
        key = SigningKey.generate()
        identity = SimpleNamespace(
            empreinte=empreinte,
            cle_pub_revoquation=bytes(key.verify_key),
            statut="active",
        )
        database = FakeDatabase(identity)
        signature = key.sign(f"VERROU-REVOKE-V1\n{empreinte}".encode()).signature.hex()

        result = await revoquer_identite(
            empreinte, RevoquerIdentiteRequest(signature_hex=signature), database
        )

        self.assertEqual(result["statut"], "revoquee")
        self.assertEqual(identity.statut, "revoquee")
        self.assertTrue(database.committed)

    async def test_invalid_recovery_signature_does_not_revoke_identity(self):
        empreinte = "b" * 64
        recovery_key = SigningKey.generate()
        other_key = SigningKey.generate()
        identity = SimpleNamespace(
            empreinte=empreinte,
            cle_pub_revoquation=bytes(recovery_key.verify_key),
            statut="active",
        )
        database = FakeDatabase(identity)
        signature = other_key.sign(
            f"VERROU-REVOKE-V1\n{empreinte}".encode()
        ).signature.hex()

        with self.assertRaises(HTTPException) as error:
            await revoquer_identite(
                empreinte, RevoquerIdentiteRequest(signature_hex=signature), database
            )

        self.assertEqual(error.exception.status_code, 403)
        self.assertEqual(identity.statut, "active")
        self.assertFalse(database.committed)
