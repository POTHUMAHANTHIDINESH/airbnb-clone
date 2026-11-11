from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, security, services

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(models.User).where(models.User.email == body.email.lower()))
    if not u or u.password_hash != security.hash_password(body.password):
        raise HTTPException(401, "Incorrect email or password")
    return dict(token=security.make_token(u.id), user=services.user_out(u))


@router.post("/register", status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(models.User).where(models.User.email == body.email)):
        raise HTTPException(409, "An account with this email already exists")
    u = models.User(name=body.name, email=body.email, password_hash=security.hash_password(body.password),
                    avatar=f"https://i.pravatar.cc/150?u={body.email}")
    db.add(u); db.commit()
    return dict(token=security.make_token(u.id), user=services.user_out(u))


@router.get("/me")
def me(user=Depends(security.current_user)):
    return services.user_out(user)


@router.post("/become-host")
def become_host(user=Depends(security.current_user), db: Session = Depends(get_db)):
    user.is_host = True
    db.merge(user); db.commit()
    return services.user_out(user)
