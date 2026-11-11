# Airbnb Clone — SDE Fullstack Assignment

A functional Airbnb-style marketplace: browse & search listings, view details, book stays with date validation,
manage trips, wishlist favourites, leave reviews, and host (full listing CRUD + dashboard).

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript, plain CSS (design tokens, dark mode), Leaflet map |
| Backend | Python 3.10+, FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database | SQLite (auto-created and auto-seeded on first start) |

## Quick start

**1. Backend** (http://localhost:8000, docs at `/docs`)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The DB (`backend/airbnb.db`) is created and seeded on first start. Re-seed from scratch: `python -m app.seed --reset`.

**2. Frontend** (http://localhost:3000)
```bash
cd frontend
cp .env.local.example .env.local       # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

**Demo accounts** (password `password123`): guest `guest@demo.com` · host `host@demo.com`
(the login modal also has one-click demo buttons). Other seeded users: marco@, elena@, liam@, yuki@ (hosts), sam@, jordan@, taylor@, riley@ (guests), all `@demo.com`.

**Tests:** `cd backend && pytest -q`

## Feature map (vs. the assignment)
- **Home & search** – listing grid (photo carousel, title, location, price, rating), search bar (where / date range / guests),
  category row, filters modal (price, property type, bedrooms, amenities), sorting, server-side pagination.
  Date search hides listings that already have an overlapping booking.
- **Listing detail** – photo gallery + fullscreen viewer, description, amenities, host info, availability calendar (booked dates disabled),
  price breakdown (nightly × nights + cleaning + service fee), reviews, map.
- **Booking** – date + guest validation (past dates, capacity, overlap → 409), mocked checkout, confirmation code,
  **My Trips** (upcoming / past, cancel). Bookings persist and block the dates on the listing.
- **Host** – create / edit / delete listings (URL or file-upload photos, reorder), dashboard with stats, owned listings and reservations.
- **Airbnb feel** – sticky header, modals, popovers, toasts, skeleton loaders, wishlist hearts (optimistic).
- **Bonus** – interactive map (Leaflet), reviews after a completed stay, "Guest favourite" badge (≥3 reviews and avg ≥4.8) with rating aggregation,
  dark mode, responsive layout (mobile search modal).
- **Mocked / placeholders** – payment (fake card form, nothing charged), messaging ("Coming soon"), identity verification, simplified auth.

## Architecture
```
backend/app
  main.py        app setup, CORS, static /uploads, startup create_all + seed
  database.py    engine/session (SQLite, foreign keys on)
  models.py      SQLAlchemy schema
  schemas.py     Pydantic request validation
  security.py    password hashing, HMAC bearer tokens, dependencies (optional/current user, current host)
  services.py    pricing, overlap check, rating aggregation, serializers
  routers/       auth · listings (search/detail/quote/availability/reviews) · bookings (+reviews) · host (CRUD, uploads) · wishlist
  seed.py        37 listings, 5 hosts, 5 guests, ~145 reviews, past + upcoming bookings
frontend/src
  app/           routes: / · listings/[id] · trips · wishlist · host · host/new · host/[id]/edit
  components/    Header, SearchBar, DateRange, CategoryBar, FiltersModal, ListingCard, Gallery, BookingWidget,
                 CheckoutModal, ReviewsSection, ListingForm, Modal, Providers (auth + toast) …
  lib/           API client, types, utils
```
Routers are thin, business rules live in `services.py`, search state lives in the URL (shareable, back-button friendly),
and UI components are small and prop-driven.

## Database schema
```
users(id, name, email*, password_hash, avatar, bio, is_host, created_at)
amenities(id, name*, icon)            listing_amenities(listing_id, amenity_id)   -- many-to-many
listings(id, host_id→users, title, description, property_type, category, city, country, address, lat, lng,
         price_per_night, cleaning_fee, max_guests, bedrooms, beds, baths, created_at)
listing_photos(id, listing_id→listings, url, position)
bookings(id, listing_id→listings, guest_id→users, check_in, check_out, guests, nights, subtotal, cleaning_fee,
         service_fee, total, status[confirmed|cancelled], confirmation_code*, created_at)
reviews(id, listing_id, booking_id* (one review per booking), author_id, rating 1-5, comment, created_at)
wishlist(user_id, listing_id)         -- composite PK
```
Constraints/indexes: `check_out > check_in`, `price > 0`, `rating BETWEEN 1 AND 5`, FK cascades, indexes on
`listings(city, price)` and `bookings(listing_id, check_in, check_out)`.

## API overview (prefix `/api`)
| Method & path | Purpose |
|---|---|
| `POST /auth/login`, `/auth/register`, `GET /auth/me`, `POST /auth/become-host` | auth and guest/host role |
| `GET /meta` | categories, property types, amenities |
| `GET /listings?q&check_in&check_out&guests&min_price&max_price&property_type&category&amenities&bedrooms&sort&page&page_size` | search |
| `GET /listings/{id}` · `/availability` · `/quote` · `/reviews` | detail, booked ranges, price quote, reviews |
| `POST /bookings` · `GET /bookings/mine` · `POST /bookings/{id}/cancel` | booking flow |
| `POST /reviews` | review a completed stay |
| `GET/POST/DELETE /wishlist[/{id}]` | favourites |
| `GET/POST /host/listings`, `GET/PUT/DELETE /host/listings/{id}`, `GET /host/bookings`, `POST /uploads` | host CRUD (hosts only) |

## Assumptions
- Stays are priced per night; the check-out day is free for the next guest's check-in (half-open intervals). Max 90 nights.
- Service fee is 14% of the nightly subtotal; cleaning fee is set by the host.
- Any user can become a host with one click (guest vs host roles). Auth is simplified (HMAC token in `localStorage`), not production-grade.
- Listing photos are placeholder images from picsum.photos (seeded URLs); hosts may paste URLs or upload files (stored in `backend/uploads`).
- The seeded demo guest has one upcoming trip and two completed, unreviewed trips so the review flow can be tried immediately.

## Deployment
- **Backend** (Render/Railway/Fly): `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  Set `CORS_ORIGINS=https://<your-frontend>` and `SECRET_KEY=<random>`. SQLite and `uploads/` need a persistent disk
  (otherwise they reset on redeploy; the app reseeds automatically).
- **Frontend** (Vercel/Netlify): root `frontend/`, env `NEXT_PUBLIC_API_URL=https://<your-backend>`.
