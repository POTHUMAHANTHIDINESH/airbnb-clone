"""Simplified auth: salted SHA-256 passwords + HMAC-signed bearer tokens (mocked, not production-grade)."""
import hashlib, hmac, os, base64
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from . import models

SECRET = os.getenv("SECRET_KEY", "dev-secret-change-me").encode()


def hash_password(pw: str) -> str:
    return hashlib.sha256(b"airbnb-clone:" + pw.encode()).hexdigest()


def make_token(user_id: int) -> str:
    sig = hmac.new(SECRET, str(user_id).encode(), hashlib.sha256).hexdigest()[:32]
    return base64.urlsafe_b64encode(f"{user_id}:{sig}".encode()).decode()


def parse_token(token: str) -> int | None:
    try:
        uid, sig = base64.urlsafe_b64decode(token.encode()).decode().split(":")
        good = hmac.new(SECRET, uid.encode(), hashlib.sha256).hexdigest()[:32]
        return int(uid) if hmac.compare_digest(sig, good) else None
    except Exception:
        return None


def optional_user(authorization: str | None = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    uid = parse_token(authorization[7:])
    return db.get(models.User, uid) if uid else None


def current_user(user=Depends(optional_user)):
    if not user:
        raise HTTPException(401, "Please log in to continue")
    return user


def current_host(user=Depends(current_user)):
    if not user.is_host:
        raise HTTPException(403, "Switch to hosting to manage listings")
    return user
