import nacl.exceptions
import nacl.signing


def verifier_signature_ed25519(
    cle_pub_signature_bytes: bytes, message_bytes: bytes, signature_bytes: bytes
) -> bool:
    try:
        verify_key = nacl.signing.VerifyKey(cle_pub_signature_bytes)
        verify_key.verify(message_bytes, signature_bytes)
        return True
    except Exception:  # type: ignore # noqa: BLE001
        # On attrape toutes les exceptions (BadSignatureError, clés malformées, etc.)
        # et on renvoie False pour éviter de faire crasher le serveur.
        return False