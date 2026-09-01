import os
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Secret key for signing JWT tokens
JWT_SECRET = os.getenv("JWT_SECRET", "GUJARAT_CYBER_VISION_SENTINEL_SECURE_KEY_2026_!#*99")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def generate_salt() -> str:
    """Generate a cryptographically secure random salt."""
    return secrets.token_hex(16)

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hash a password using PBKDF2-HMAC-SHA256 with salt.
    Returns (hashed_password_hex, salt).
    """
    if not salt:
        salt = generate_salt()
    
    # 100,000 iterations of PBKDF2 with SHA-256
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return key.hex(), salt

def verify_password(plain_password: str, stored_hash: Optional[str], salt: Optional[str] = None, legacy_plain: Optional[str] = None) -> bool:
    """
    Verify password against hashed value or fallback to legacy plain text check for smooth migration.
    """
    if stored_hash and salt:
        expected_hash, _ = hash_password(plain_password, salt)
        if secrets.compare_digest(expected_hash, stored_hash):
            return True
    
    # Fallback to legacy plain-text password for backward compatibility
    if legacy_plain and secrets.compare_digest(plain_password, legacy_plain):
        return True

    return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "Gujarat_Cyber_Vision_Sentinel"
    })
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
