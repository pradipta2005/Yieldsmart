"""
auth.py — JWT authentication + password hashing for YieldSmart
"""
import os
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("JWT_SECRET", "yieldsmart-ultra-secret-2025-change-in-prod"))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_access_token(user_id: int, email: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

# ── DB helpers ────────────────────────────────────────────────────────────────

def create_user(name: str, email: str, password: str, city: str) -> dict:
    initials = "".join(w[0].upper() for w in name.split()[:2])
    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO users (name, email, password_hash, city, avatar_initials) VALUES (?, ?, ?, ?, ?)",
            (name, email.lower().strip(), hash_password(password), city.strip(), initials)
        )
        conn.commit()
        return {"id": cursor.lastrowid, "name": name, "email": email.lower(), "city": city, "initials": initials}
    except Exception as e:
        conn.rollback()
        if "UNIQUE constraint" in str(e):
            raise HTTPException(status_code=400, detail="An account with this email already exists.")
        raise HTTPException(status_code=500, detail="Could not create account.")
    finally:
        conn.close()

def authenticate_user(email: str, password: str) -> Optional[dict]:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT id, name, email, city, password_hash, avatar_initials, created_at FROM users WHERE email = ?",
            (email.lower().strip(),)
        ).fetchone()
        if not row or not verify_password(password, row["password_hash"]):
            return None
        return {
            "id": row["id"], "name": row["name"], "email": row["email"],
            "city": row["city"], "initials": row["avatar_initials"],
            "created_at": row["created_at"]
        }
    finally:
        conn.close()

def get_user_by_id(user_id: int) -> Optional[dict]:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT id, name, email, city, avatar_initials, created_at FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

# ── FastAPI dependency ────────────────────────────────────────────────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)) -> dict:
    """Dependency — extracts and validates JWT from Authorization header."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_optional_user(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)) -> Optional[dict]:
    """Dependency — returns user if authenticated, else None (for optional auth routes)."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    return get_user_by_id(int(payload["sub"]))
