from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from .. import models, services, security
from .listings import get_or_404

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.get("")
def list_wishlist(db: Session = Depends(get_db), user=Depends(security.current_user)):
    rows = db.scalars(select(models.Listing).join(models.Wishlist).where(models.Wishlist.user_id == user.id)
                      .options(selectinload(models.Listing.photos), selectinload(models.Listing.host))).all()
    stats = services.rating_stats(db, [r.id for r in rows])
    return [services.listing_card(r, stats, {r.id for r in rows}) for r in rows]


@router.post("/{listing_id}", status_code=201)
def add(listing_id: int, db: Session = Depends(get_db), user=Depends(security.current_user)):
    get_or_404(db, listing_id)
    if not db.get(models.Wishlist, (user.id, listing_id)):
        db.add(models.Wishlist(user_id=user.id, listing_id=listing_id)); db.commit()
    return dict(wished=True)


@router.delete("/{listing_id}")
def remove(listing_id: int, db: Session = Depends(get_db), user=Depends(security.current_user)):
    w = db.get(models.Wishlist, (user.id, listing_id))
    if w:
        db.delete(w); db.commit()
    return dict(wished=False)
