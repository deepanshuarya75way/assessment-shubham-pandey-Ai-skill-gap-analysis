import hashlib
import hmac
import os
import secrets
import sqlite3
import uuid
from contextlib import closing
from pathlib import Path
from app.utils.jwt_utils import create_access_token


PASSWORD_HASH_ITERATIONS = 600_000
_default_database = Path(os.getenv("LOCALAPPDATA", str(Path.home()))) / "AIInterviewPlatform" / "users.sqlite3"
AUTH_DATABASE_PATH = Path(os.getenv("AUTH_DATABASE_PATH", str(_default_database))).expanduser()


def _connect() -> sqlite3.Connection:
    AUTH_DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(AUTH_DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def _initialize_database() -> None:
    with closing(_connect()) as connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                id TEXT NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL
            )"""
        )
        connection.commit()


def _find_user(email: str) -> dict | None:
    with closing(_connect()) as connection:
        row = connection.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?",
            (email,),
        ).fetchone()
    return dict(row) if row else None


_initialize_database()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    )
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, iteration_text, salt_text, expected_digest = encoded_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256" or int(iteration_text) != PASSWORD_HASH_ITERATIONS:
            return False
        salt = bytes.fromhex(salt_text)
    except (ValueError, TypeError):
        return False

    actual_digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    ).hex()
    return hmac.compare_digest(actual_digest, expected_digest)


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
    }


def signup(name: str | None, email: str, password: str) -> dict:
    normalized_email = email.strip().lower()
    user = {
        "id": str(uuid.uuid4()),
        "name": name or normalized_email.split("@")[0],
        "email": normalized_email,
        "password_hash": hash_password(password),
    }
    try:
        with closing(_connect()) as connection:
            with connection:
                connection.execute(
                    "INSERT INTO users (email, id, name, password_hash) VALUES (?, ?, ?, ?)",
                    (user["email"], user["id"], user["name"], user["password_hash"]),
                )
    except sqlite3.IntegrityError as error:
        raise ValueError("Email already registered") from error

    # Create JWT token with email as subject
    token = create_access_token(data={"sub": normalized_email})

    return {"token": token, "user": public_user(user)}


def login(email: str, password: str) -> dict:
    normalized_email = email.strip().lower()
    user = _find_user(normalized_email)

    if not user or not verify_password(password, user["password_hash"]):
        raise ValueError("Invalid email or password")

    # Create JWT token with email as subject
    token = create_access_token(data={"sub": normalized_email})

    return {"token": token, "user": public_user(user)}
