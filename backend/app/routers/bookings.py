import secrets
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from .. import models, schemas, services, security
from .listings import get_or_404

router = APIRouter(prefix="/api", tags=["bookings"])


@router.post("/bookings", status_code=201)
def create_booking(body: schemas.BookingIn, db: Session = Depends(get_db), user=Depends(security.current_user)):
    l = get_or_404(db, body.listing_id)
    if l.host_id == user.id:
        raise HTTPException(422, "You can't book your own listing")
    q = services.quote(l, body.check_in, body.check_out, body.guests)
    if services.overlapping(db, l.id, body.check_in, body.check_out):
        raise HTTPException(409, "Those dates are no longer available")
    b = models.Booking(listing_id=l.id, guest_id=user.id, check_in=body.check_in, check_out=body.check_out,
                       guests=body.guests, nights=q["nights"], subtotal=q["subtotal"],
                       cleaning_fee=q["cleaning_fee"], service_fee=q["service_fee"], total=q["total"],
                       confirmation_code="HM" + secrets.token_hex(4).upper())
    db.add(b); db.commit(); db.refresh(b)
    return services.booking_out(b)


@router.get("/bookings/mine")
def my_trips(db: Session = Depends(get_db), user=Depends(security.current_user)):
    rows = db.scalars(select(models.Booking).where(models.Booking.guest_id == user.id)
                      .options(selectinload(models.Booking.listing).selectinload(models.Listing.photos),
                               selectinload(models.Booking.review), selectinload(models.Booking.guest))
                      .order_by(models.Booking.check_in.desc())).all()
    return [services.booking_out(b) for b in rows]


@router.post("/bookings/{booking_id}/cancel")
def cancel(booking_id: int, db: Session = Depends(get_db), user=Depends(security.current_user)):
    b = db.get(models.Booking, booking_id)
    if not b or b.guest_id != user.id:
        raise HTTPException(404, "Booking not found")
    if b.check_in <= date.today():
        raise HTTPException(422, "Trips that already started can't be cancelled")
    b.status = "cancelled"; db.commit()
    return services.booking_out(b)


@router.post("/reviews", status_code=201)
def leave_review(body: schemas.ReviewIn, db: Session = Depends(get_db), user=Depends(security.current_user)):
    b = db.get(models.Booking, body.booking_id)
    if not b or b.guest_id != user.id or b.status != "confirmed":
        raise HTTPException(404, "Booking not found")
    if b.check_out >= date.today():
        raise HTTPException(422, "You can review a stay after it ends")
    if b.review:
        raise HTTPException(409, "You already reviewed this stay")
    r = models.Review(listing_id=b.listing_id, booking_id=b.id, author_id=user.id,
                      rating=body.rating, comment=body.comment)
    db.add(r); db.commit()
    return dict(id=r.id)
