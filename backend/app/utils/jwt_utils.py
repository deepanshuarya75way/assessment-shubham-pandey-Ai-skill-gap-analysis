import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
import jwt
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()

_DEFAULT_SECRET_KEYS = {
    "your-secret-key-change-in-production",
    "your-super-secret-key-change-this-in-production-12345",
}
_configured_secret = os.getenv("JWT_SECRET_KEY")
_is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"

if _is_production and (
    not _configured_secret
    or len(_configured_secret) < 32
    or _configured_secret in _DEFAULT_SECRET_KEYS
):
    raise RuntimeError("Set JWT_SECRET_KEY to a unique value of at least 32 characters in production.")


def _load_or_create_development_secret() -> str:
    local_data = Path(os.getenv("LOCALAPPDATA", str(Path.home()))) / "AIInterviewPlatform"
    secret_path = Path(os.getenv("JWT_SECRET_KEY_PATH", str(local_data / "jwt-secret.key"))).expanduser()
    secret_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        descriptor = os.open(secret_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        secret = secret_path.read_text(encoding="ascii").strip()
    else:
        secret = secrets.token_urlsafe(48)
        with os.fdopen(descriptor, "w", encoding="ascii") as secret_file:
            secret_file.write(secret)
            secret_file.flush()
            os.fsync(secret_file.fileno())

    if len(secret) < 32:
        raise RuntimeError("The local JWT signing key is missing or invalid.")
    return secret


SECRET_KEY = (
    _configured_secret
    if _configured_secret and _configured_secret not in _DEFAULT_SECRET_KEYS
    else _load_or_create_development_secret()
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


def extract_user_from_token(token: str) -> str:
    """Extract email from token."""
    payload = verify_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )
    return email
