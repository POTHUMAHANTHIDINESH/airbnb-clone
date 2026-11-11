"""Business logic shared by routers: pricing, availability, serialization."""
from datetime import date
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import models

SERVICE_FEE_RATE = 0.14


def quote(listing: models.Listing, check_in: date, check_out: date, guests: int) -> dict:
    if check_out <= check_in:
        raise HTTPException(422, "Check-out must be after check-in")
    if check_in < date.today():
        raise HTTPException(422, "Check-in can't be in the past")
    if guests > listing.max_guests:
        raise HTTPException(422, f"This place allows up to {listing.max_guests} guests")
    nights = (check_out - check_in).days
    if nights > 90:
        raise HTTPException(422, "Stays are limited to 90 nights")
    subtotal = nights * listing.price_per_night
    service = round(subtotal * SERVICE_FEE_RATE)
    return dict(nights=nights, nightly=listing.price_per_night, subtotal=subtotal,
                cleaning_fee=listing.cleaning_fee, service_fee=service,
                total=subtotal + listing.cleaning_fee + service)


def overlapping(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    """Half-open interval overlap: [in, out). Same-day turnover is allowed."""
    q = select(func.count(models.Booking.id)).where(
        models.Booking.listing_id == listing_id,
        models.Booking.status == "confirmed",
        models.Booking.check_in < check_out,
        models.Booking.check_out > check_in)
    return db.scalar(q) > 0


def rating_stats(db: Session, listing_ids: list[int]) -> dict[int, tuple[float, int]]:
    rows = db.execute(select(models.Review.listing_id, func.avg(models.Review.rating), func.count())
                      .where(models.Review.listing_id.in_(listing_ids)).group_by(models.Review.listing_id)).all()
    return {r[0]: (round(float(r[1]), 2), r[2]) for r in rows}


def user_out(u: models.User) -> dict:
    return dict(id=u.id, name=u.name, email=u.email, avatar=u.avatar, bio=u.bio, is_host=u.is_host,
                joined=u.created_at.year)


def listing_card(l: models.Listing, stats: dict, wished: set[int]) -> dict:
    avg, cnt = stats.get(l.id, (0, 0))
    return dict(id=l.id, title=l.title, city=l.city, country=l.country, property_type=l.property_type,
                category=l.category, price_per_night=l.price_per_night, rating=avg, review_count=cnt,
                photos=[p.url for p in l.photos], lat=l.lat, lng=l.lng, beds=l.beds, bedrooms=l.bedrooms,
                max_guests=l.max_guests, wished=l.id in wished, host_name=l.host.name,
                superhost=is_superhost(avg, cnt))


def is_superhost(avg: float, cnt: int) -> bool:
    return cnt >= 3 and avg >= 4.8


def listing_detail(l: models.Listing, stats: dict, wished: set[int]) -> dict:
    d = listing_card(l, stats, wished)
    d.update(description=l.description, address=l.address, baths=l.baths, cleaning_fee=l.cleaning_fee,
             amenities=[dict(name=a.name, icon=a.icon) for a in l.amenities],
             host=dict(id=l.host.id, name=l.host.name, avatar=l.host.avatar, bio=l.host.bio,
                       joined=l.host.created_at.year))
    return d


def booking_out(b: models.Booking) -> dict:
    l = b.listing
    return dict(id=b.id, code=b.confirmation_code, status=b.status, check_in=b.check_in, check_out=b.check_out,
                guests=b.guests, nights=b.nights, subtotal=b.subtotal, cleaning_fee=b.cleaning_fee,
                service_fee=b.service_fee, total=b.total, created_at=b.created_at,
                past=b.check_out < date.today(), reviewed=b.review is not None,
                listing=dict(id=l.id, title=l.title, city=l.city, country=l.country,
                             photo=l.photos[0].url if l.photos else ""),
                guest=dict(id=b.guest.id, name=b.guest.name, avatar=b.guest.avatar))
