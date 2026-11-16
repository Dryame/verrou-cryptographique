import nacl.signing
import nacl.exceptions

def verifier_signature_ed25519(cle_pub_signature_bytes: bytes, message_bytes: bytes, signature_bytes: bytes) -> bool:
    try:
        verify_key = nacl.signing.VerifyKey(cle_pub_signature_bytes)
        verify_key.verify(message_bytes, signature_bytes)
        return True
    except (nacl.exceptions.BadSignatureError, Exception):
        return False