import os, uuid, shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from ..database import get_db
from .. import models, schemas, services, security
from ..fixtures import PROPERTY_TYPES, CATEGORIES

router = APIRouter(prefix="/api", tags=["host"])
from ..host_paths import UPLOAD_DIR


def _apply(l: models.Listing, body: schemas.ListingIn, db: Session):
    if body.property_type not in PROPERTY_TYPES:
        raise HTTPException(422, "Unknown property type")
    if body.category not in CATEGORIES_NAMES:
        raise HTTPException(422, "Unknown category")
    for f in ("title", "description", "property_type", "category", "city", "country", "address", "lat", "lng",
              "price_per_night", "cleaning_fee", "max_guests", "bedrooms", "beds", "baths"):
        setattr(l, f, getattr(body, f))
    l.amenities = list(db.scalars(select(models.Amenity).where(models.Amenity.name.in_(body.amenities))))
    l.photos = [models.ListingPhoto(url=u, position=i) for i, u in enumerate(body.photos)]


CATEGORIES_NAMES = [c["name"] for c in CATEGORIES]


@router.post("/uploads")
def upload(file: UploadFile = File(...), user=Depends(security.current_host)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        raise HTTPException(422, "Upload a JPG, PNG, WEBP or GIF image")
    name = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(os.path.join(UPLOAD_DIR, name), "wb") as out:
        shutil.copyfileobj(file.file, out)
    return dict(url=f"/uploads/{name}")


@router.get("/host/listings")
def my_listings(db: Session = Depends(get_db), user=Depends(security.current_host)):
    rows = db.scalars(select(models.Listing).where(models.Listing.host_id == user.id)
                      .options(selectinload(models.Listing.photos), selectinload(models.Listing.host))
                      .order_by(models.Listing.id.desc())).all()
    stats = services.rating_stats(db, [r.id for r in rows])
    return [services.listing_card(r, stats, set()) for r in rows]


@router.get("/host/listings/{listing_id}")
def my_listing(listing_id: int, db: Session = Depends(get_db), user=Depends(security.current_host)):
    l = db.get(models.Listing, listing_id)
    if not l or l.host_id != user.id:
        raise HTTPException(404, "Listing not found")
    return services.listing_detail(l, services.rating_stats(db, [l.id]), set())


@router.post("/host/listings", status_code=201)
def create(body: schemas.ListingIn, db: Session = Depends(get_db), user=Depends(security.current_host)):
    l = models.Listing(host_id=user.id)
    _apply(l, body, db)
    db.add(l); db.commit()
    return dict(id=l.id)


@router.put("/host/listings/{listing_id}")
def update(listing_id: int, body: schemas.ListingIn, db: Session = Depends(get_db), user=Depends(security.current_host)):
    l = db.get(models.Listing, listing_id)
    if not l or l.host_id != user.id:
        raise HTTPException(404, "Listing not found")
    _apply(l, body, db); db.commit()
    return dict(id=l.id)


@router.delete("/host/listings/{listing_id}", status_code=204)
def delete(listing_id: int, db: Session = Depends(get_db), user=Depends(security.current_host)):
    l = db.get(models.Listing, listing_id)
    if not l or l.host_id != user.id:
        raise HTTPException(404, "Listing not found")
    db.delete(l); db.commit()


@router.get("/host/bookings")
def host_bookings(db: Session = Depends(get_db), user=Depends(security.current_host)):
    rows = db.scalars(select(models.Booking).join(models.Listing).where(models.Listing.host_id == user.id)
                      .options(selectinload(models.Booking.listing).selectinload(models.Listing.photos),
                               selectinload(models.Booking.review), selectinload(models.Booking.guest))
                      .order_by(models.Booking.check_in.desc())).all()
    return [services.booking_out(b) for b in rows]
