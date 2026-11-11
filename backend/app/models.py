"""Database schema (SQLAlchemy 2.0).

users 1─* listings 1─* listing_photos
listings *─* amenities (listing_amenities)
listings 1─* bookings *─1 users(guest)
bookings 1─0..1 reviews      (one review per completed booking)
users *─* listings (wishlist)
"""
from datetime import datetime, date
from sqlalchemy import (String, Integer, Float, Text, Date, DateTime, ForeignKey,
                        UniqueConstraint, CheckConstraint, Index, Table, Column)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

listing_amenities = Table(
    "listing_amenities", Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    avatar: Mapped[str] = mapped_column(String(300), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    is_host: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    listings = relationship("Listing", back_populates="host")


class Amenity(Base):
    __tablename__ = "amenities"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    icon: Mapped[str] = mapped_column(String(8), default="✓")


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price_per_night > 0"),
        CheckConstraint("max_guests > 0"),
        Index("ix_listings_city", "city"),
        Index("ix_listings_price", "price_per_night"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text)
    property_type: Mapped[str] = mapped_column(String(40))   # House, Apartment, Cabin...
    category: Mapped[str] = mapped_column(String(40))        # Beachfront, Cabins, Amazing views...
    city: Mapped[str] = mapped_column(String(80))
    country: Mapped[str] = mapped_column(String(80))
    address: Mapped[str] = mapped_column(String(200), default="")
    lat: Mapped[float] = mapped_column(Float, default=0)
    lng: Mapped[float] = mapped_column(Float, default=0)
    price_per_night: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)
    max_guests: Mapped[int] = mapped_column(Integer, default=2)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    baths: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    host = relationship("User", back_populates="listings")
    photos = relationship("ListingPhoto", cascade="all, delete-orphan", order_by="ListingPhoto.position")
    amenities = relationship("Amenity", secondary=listing_amenities)
    bookings = relationship("Booking", cascade="all, delete-orphan", back_populates="listing")
    reviews = relationship("Review", cascade="all, delete-orphan", back_populates="listing")


class ListingPhoto(Base):
    __tablename__ = "listing_photos"
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(400))
    position: Mapped[int] = mapped_column(Integer, default=0)


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in"),
        Index("ix_bookings_listing_dates", "listing_id", "check_in", "check_out"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    guests: Mapped[int] = mapped_column(Integer)
    nights: Mapped[int] = mapped_column(Integer)
    subtotal: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer)
    service_fee: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")  # confirmed | cancelled
    confirmation_code: Mapped[str] = mapped_column(String(12), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    listing = relationship("Listing", back_populates="bookings")
    guest = relationship("User")
    review = relationship("Review", uselist=False, back_populates="booking")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("booking_id"), CheckConstraint("rating BETWEEN 1 AND 5"))
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"))
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    listing = relationship("Listing", back_populates="reviews")
    booking = relationship("Booking", back_populates="review")
    author = relationship("User")


class Wishlist(Base):
    __tablename__ = "wishlist"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
