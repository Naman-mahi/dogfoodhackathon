import hmac
import hashlib
import secrets
import bcrypt
from app.core.config import settings

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return plain_password == hashed_password

def generate_session_token(prefix: str = "sess") -> str:
    return f"{prefix}_{secrets.token_hex(16)}"

def generate_certificate_signature(payload: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()

def verify_certificate_signature(payload: str, signature: str) -> bool:
    expected = generate_certificate_signature(payload)
    return hmac.compare_digest(expected, signature)
