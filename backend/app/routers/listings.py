from datetime import date
from math import ceil
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from .. import models, services, security
from ..fixtures import CATEGORIES, PROPERTY_TYPES, AMENITIES
from fastapi import HTTPException

router = APIRouter(prefix="/api", tags=["listings"])


def _wished(db, user) -> set[int]:
    if not user:
        return set()
    return set(db.scalars(select(models.Wishlist.listing_id).where(models.Wishlist.user_id == user.id)))


@router.get("/meta")
def meta():
    return dict(categories=CATEGORIES, property_types=PROPERTY_TYPES,
                amenities=[dict(name=n, icon=i) for n, i in AMENITIES])


@router.get("/listings")
def search(q: str | None = None, check_in: date | None = None, check_out: date | None = None,
           guests: int = 1, min_price: int | None = None, max_price: int | None = None,
           property_type: list[str] = Query(default=[]), category: str | None = None,
           amenities: list[str] = Query(default=[]), bedrooms: int = 0,
           sort: str = "recommended", page: int = Query(1, ge=1), page_size: int = Query(12, ge=1, le=48),
           db: Session = Depends(get_db), user=Depends(security.optional_user)):
    L = models.Listing
    conds = [L.max_guests >= guests, L.bedrooms >= bedrooms]
    if q:
        like = f"%{q.strip()}%"
        conds.append(or_(L.city.ilike(like), L.country.ilike(like), L.title.ilike(like)))
    if min_price is not None: conds.append(L.price_per_night >= min_price)
    if max_price is not None: conds.append(L.price_per_night <= max_price)
    if property_type: conds.append(L.property_type.in_(property_type))
    if category: conds.append(L.category == category)
    for a in amenities:  # must have ALL selected amenities
        conds.append(L.amenities.any(models.Amenity.name == a))
    if check_in and check_out and check_out > check_in:  # exclude listings with an overlapping booking
        conds.append(~L.bookings.any(and_(models.Booking.status == "confirmed",
                                          models.Booking.check_in < check_out,
                                          models.Booking.check_out > check_in)))
    total = db.scalar(select(func.count(L.id)).where(*conds))
    stmt = select(L).where(*conds).options(selectinload(L.photos), selectinload(L.host))
    stmt = {"price_asc": stmt.order_by(L.price_per_night.asc()),
            "price_desc": stmt.order_by(L.price_per_night.desc()),
            "newest": stmt.order_by(L.created_at.desc(), L.id.desc())}.get(sort, stmt.order_by(L.id.asc()))
    rows = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    stats = services.rating_stats(db, [r.id for r in rows])
    wished = _wished(db, user)
    return dict(items=[services.listing_card(r, stats, wished) for r in rows], total=total,
                page=page, pages=max(1, ceil(total / page_size)))


def get_or_404(db, listing_id) -> models.Listing:
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    return l


@router.get("/listings/{listing_id}")
def detail(listing_id: int, db: Session = Depends(get_db), user=Depends(security.optional_user)):
    l = get_or_404(db, listing_id)
    return services.listing_detail(l, services.rating_stats(db, [l.id]), _wished(db, user))


@router.get("/listings/{listing_id}/availability")
def availability(listing_id: int, db: Session = Depends(get_db)):
    get_or_404(db, listing_id)
    rows = db.scalars(select(models.Booking).where(models.Booking.listing_id == listing_id,
                                                    models.Booking.status == "confirmed",
                                                    models.Booking.check_out >= date.today())).all()
    return dict(booked=[dict(check_in=b.check_in, check_out=b.check_out) for b in rows])


@router.get("/listings/{listing_id}/quote")
def get_quote(listing_id: int, check_in: date, check_out: date, guests: int = 1, db: Session = Depends(get_db)):
    l = get_or_404(db, listing_id)
    q = services.quote(l, check_in, check_out, guests)
    q["available"] = not services.overlapping(db, l.id, check_in, check_out)
    return q


@router.get("/listings/{listing_id}/reviews")
def reviews(listing_id: int, db: Session = Depends(get_db)):
    rows = db.scalars(select(models.Review).where(models.Review.listing_id == listing_id)
                      .options(selectinload(models.Review.author)).order_by(models.Review.created_at.desc())).all()
    return [dict(id=r.id, rating=r.rating, comment=r.comment, created_at=r.created_at,
                 author=dict(name=r.author.name, avatar=r.author.avatar)) for r in rows]
