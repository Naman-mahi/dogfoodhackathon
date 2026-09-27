import hmac
import hashlib
import secrets
from app.core.config import settings

def generate_session_token(prefix: str = "sess") -> str:
    return f"{prefix}_{secrets.token_hex(16)}"

def generate_certificate_signature(payload: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()

def verify_certificate_signature(payload: str, signature: str) -> bool:
    expected = generate_certificate_signature(payload)
    return hmac.compare_digest(expected, signature)
