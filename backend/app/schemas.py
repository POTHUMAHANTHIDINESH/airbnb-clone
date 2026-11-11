"""Pydantic request/response models."""
from datetime import date
from pydantic import BaseModel, Field, field_validator
import re


class LoginIn(BaseModel):
    email: str
    password: str


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str
    password: str = Field(min_length=6)

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Enter a valid email address")
        return v.lower()


class ListingIn(BaseModel):
    title: str = Field(min_length=5, max_length=140)
    description: str = Field(min_length=20)
    property_type: str
    category: str
    city: str = Field(min_length=2)
    country: str = Field(min_length=2)
    address: str = ""
    lat: float = 0
    lng: float = 0
    price_per_night: int = Field(gt=0, le=100000)
    cleaning_fee: int = Field(ge=0, default=0)
    max_guests: int = Field(ge=1, le=32)
    bedrooms: int = Field(ge=0, le=50, default=1)
    beds: int = Field(ge=1, le=50, default=1)
    baths: int = Field(ge=1, le=50, default=1)
    amenities: list[str] = []
    photos: list[str] = Field(min_length=1)


class BookingIn(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1)


class ReviewIn(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=2000)
