"""Seed data: hosts, guests, ~36 listings with photos, reviews and bookings. Run: python -m app.seed [--reset]"""
import random, sys
from datetime import date, timedelta, datetime
from sqlalchemy import select, func
from .database import Base, engine, SessionLocal
from . import models
from .security import hash_password
from .fixtures import AMENITIES

PW = hash_password("password123")
ph = lambda key, n=5: [f"https://picsum.photos/seed/{key}-{i}/1200/800" for i in range(n)]

# title, city, country, lat, lng, type, category, price, guests, bedrooms
LISTINGS = [
    ("Sunlit beach house steps from the sand", "Malibu", "United States", 34.03, -118.69, "House", "Beachfront", 420, 6, 3),
    ("Cliffside villa with infinity pool", "Santorini", "Greece", 36.42, 25.43, "Villa", "Amazing views", 510, 4, 2),
    ("Cozy A-frame cabin in the pines", "Lake Tahoe", "United States", 39.10, -120.03, "Cabin", "Cabins", 245, 5, 2),
    ("Designer loft in the old town", "Lisbon", "Portugal", 38.71, -9.14, "Loft", "Design", 160, 3, 1),
    ("Rice terrace bungalow with a view", "Ubud", "Indonesia", -8.50, 115.26, "Villa", "Tropical", 135, 4, 2),
    ("Lakeside cottage with private dock", "Lake Como", "Italy", 45.99, 9.26, "Cottage", "Lakefront", 340, 6, 3),
    ("Treehouse hideaway above the forest", "Portland", "United States", 45.52, -122.68, "Treehouse", "Treehouses", 195, 2, 1),
    ("Modern penthouse overlooking the skyline", "New York", "United States", 40.75, -73.99, "Apartment", "Iconic cities", 480, 4, 2),
    ("Stone farmhouse among the vineyards", "Tuscany", "Italy", 43.46, 11.25, "House", "Countryside", 275, 8, 4),
    ("Aurora glass igloo", "Rovaniemi", "Finland", 66.50, 25.73, "Cabin", "Arctic", 390, 2, 1),
    ("Overwater bungalow on the lagoon", "Bora Bora", "French Polynesia", -16.50, -151.74, "Villa", "Luxe", 890, 2, 1),
    ("Minimalist concrete house in the hills", "Mexico City", "Mexico", 19.43, -99.13, "House", "Design", 210, 4, 2),
    ("Houseboat on the canal", "Amsterdam", "Netherlands", 52.37, 4.90, "Apartment", "Iconic cities", 230, 3, 1),
    ("Desert dome under the stars", "Joshua Tree", "United States", 34.13, -116.31, "House", "Camping", 185, 4, 1),
    ("Ski chalet with hot tub and fireplace", "Chamonix", "France", 45.92, 6.87, "Cabin", "Amazing views", 460, 8, 4),
    ("Sea-view apartment with terrace", "Barcelona", "Spain", 41.38, 2.17, "Apartment", "Iconic cities", 175, 4, 2),
    ("Jungle villa with plunge pool", "Tulum", "Mexico", 20.21, -87.46, "Villa", "Tropical", 265, 6, 3),
    ("Thatched cottage in the Cotswolds", "Cotswolds", "United Kingdom", 51.83, -1.84, "Cottage", "Countryside", 190, 4, 2),
    ("Mountain-top cabin with lake views", "Banff", "Canada", 51.18, -115.57, "Cabin", "Lakefront", 310, 6, 3),
    ("Sky-high studio in Shibuya", "Tokyo", "Japan", 35.66, 139.70, "Apartment", "Iconic cities", 145, 2, 1),
    ("Clifftop beach villa with sunset deck", "Algarve", "Portugal", 37.09, -8.27, "Villa", "Beachfront", 360, 8, 4),
    ("Artist loft with skylights", "Berlin", "Germany", 52.52, 13.40, "Loft", "Design", 120, 3, 1),
    ("Palm-fringed beach hut", "Goa", "India", 15.49, 73.83, "Cottage", "Beachfront", 70, 3, 1),
    ("Himalayan homestay with valley views", "Manali", "India", 32.24, 77.19, "Cabin", "Amazing views", 85, 4, 2),
    ("Houseboat stay on Dal Lake", "Srinagar", "India", 34.08, 74.80, "Cottage", "Lakefront", 95, 4, 2),
    ("Historic riad with courtyard pool", "Marrakech", "Morocco", 31.63, -7.98, "House", "Luxe", 205, 6, 3),
    ("Surf shack steps from the break", "Byron Bay", "Australia", -28.64, 153.61, "Cottage", "Beachfront", 165, 4, 2),
    ("Glamping tent in the redwoods", "Big Sur", "United States", 36.27, -121.81, "Cabin", "Camping", 150, 2, 1),
    ("Elegant Haussmann apartment", "Paris", "France", 48.86, 2.34, "Apartment", "Iconic cities", 285, 4, 2),
    ("Castle tower with a private garden", "Edinburgh", "United Kingdom", 55.95, -3.19, "House", "Luxe", 520, 6, 3),
    ("Fjord-front cabin with sauna", "Bergen", "Norway", 60.39, 5.32, "Cabin", "Lakefront", 280, 5, 2),
    ("Hilltop villa with panoramic ocean views", "Cape Town", "South Africa", -33.92, 18.42, "Villa", "Amazing views", 330, 7, 4),
    ("Charming cottage near the lavender fields", "Provence", "France", 43.95, 5.78, "Cottage", "Countryside", 180, 4, 2),
    ("Treetop cabin in the cloud forest", "Monteverde", "Costa Rica", 10.30, -84.82, "Treehouse", "Treehouses", 140, 2, 1),
    ("Bright loft near Gastown", "Vancouver", "Canada", 49.28, -123.11, "Loft", "Design", 170, 3, 1),
    ("Beachfront bungalow with hammocks", "Phuket", "Thailand", 7.88, 98.39, "Villa", "Tropical", 110, 4, 2),
    ("Snowed-in log cabin with wood stove", "Aspen", "United States", 39.19, -106.82, "Cabin", "Cabins", 395, 6, 3),
]
DESC = ["Wake up to unbeatable surroundings in this thoughtfully designed space. Natural light fills every room, "
        "the beds are dressed in soft linens, and the fully equipped kitchen makes long stays easy.\n\n"
        "Your host has stocked local coffee, a handwritten guide to the best nearby spots, and is always "
        "happy to share a tip. Perfect for a getaway with friends, family or a quiet working retreat."]
REVIEWS = ["Absolutely loved our stay — exactly like the photos and the host was incredibly helpful.",
           "Spotless, comfortable and in a perfect location. We'd come back in a heartbeat.",
           "Great value. The kitchen had everything we needed and the beds were so comfortable.",
           "Quiet, beautiful and easy check-in. The views alone were worth it.",
           "A little tricky to find at night but once inside it was pure magic. Highly recommend!",
           "Such a thoughtful host. Little touches everywhere made the trip memorable."]


def seed_if_empty(db):
    if db.scalar(select(func.count(models.User.id))) == 0:
        run(db)


def run(db):
    rnd = random.Random(7)
    amen = {n: models.Amenity(name=n, icon=i) for n, i in AMENITIES}
    db.add_all(amen.values())
    hosts = [models.User(name=n, email=e, password_hash=PW, is_host=True, bio=b, created_at=datetime(y, 3, 1),
                         avatar=f"https://i.pravatar.cc/150?u={e}") for n, e, b, y in [
        ("Priya Sharma", "host@demo.com", "Superhost for 5 years. I love sharing hidden gems with guests.", 2020),
        ("Marco Rossi", "marco@demo.com", "Architect & traveller. I design spaces I'd want to stay in.", 2019),
        ("Elena García", "elena@demo.com", "Hospitality runs in my family — you'll feel at home.", 2021),
        ("Liam O'Connor", "liam@demo.com", "Outdoors enthusiast. Ask me about local trails!", 2022),
        ("Yuki Tanaka", "yuki@demo.com", "Minimalist at heart, always up for a chat over tea.", 2021)]]
    guests = [models.User(name=n, email=e, password_hash=PW, bio="Love to travel.", created_at=datetime(2023, 5, 1),
                          avatar=f"https://i.pravatar.cc/150?u={e}") for n, e in [
        ("Alex Morgan", "guest@demo.com"), ("Sam Lee", "sam@demo.com"), ("Jordan Kim", "jordan@demo.com"),
        ("Taylor Brooks", "taylor@demo.com"), ("Riley Chen", "riley@demo.com")]]
    db.add_all(hosts + guests); db.flush()

    all_am = list(amen)
    listings = []
    for i, (t, city, country, lat, lng, typ, cat, price, g, br) in enumerate(LISTINGS):
        l = models.Listing(
            host_id=hosts[i % len(hosts)].id, title=t, description=DESC[0], property_type=typ, category=cat,
            city=city, country=country, address=f"{rnd.randint(10, 480)} Main Street, {city}",
            lat=lat + rnd.uniform(-.02, .02), lng=lng + rnd.uniform(-.02, .02), price_per_night=price,
            cleaning_fee=rnd.choice([30, 45, 60, 80]), max_guests=g, bedrooms=br, beds=max(1, br + rnd.randint(0, 1)),
            baths=max(1, br // 2 + 1), created_at=datetime.utcnow() - timedelta(days=rnd.randint(1, 400)))
        l.photos = [models.ListingPhoto(url=u, position=p) for p, u in enumerate(ph(f"stay{i}"))]
        l.amenities = [amen[n] for n in ["Wifi", "Kitchen"] + rnd.sample(all_am[2:], rnd.randint(3, 8))
                       if n in amen]
        listings.append(l)
    db.add_all(listings); db.flush()

    today = date.today()
    code = 1000
    for l in listings:  # past, reviewed stays => ratings
        for k in range(rnd.randint(2, 6)):
            gst = rnd.choice(guests[1:])  # demo guest (index 0) keeps unreviewed stays for the demo
            ci = today - timedelta(days=rnd.randint(20, 300)); n = rnd.randint(2, 6); co = ci + timedelta(days=n)
            if any(b.check_in < co and b.check_out > ci for b in l.bookings):
                continue
            sub = n * l.price_per_night; sv = round(sub * .14)
            b = models.Booking(listing_id=l.id, guest_id=gst.id, check_in=ci, check_out=co, guests=min(2, l.max_guests),
                               nights=n, subtotal=sub, cleaning_fee=l.cleaning_fee, service_fee=sv,
                               total=sub + l.cleaning_fee + sv, confirmation_code=f"HM{code:06d}")
            code += 1; l.bookings.append(b); db.flush()
            db.add(models.Review(listing_id=l.id, booking_id=b.id, author_id=gst.id,
                                 rating=rnd.choices([5, 4, 3], [7, 3, .3])[0], comment=rnd.choice(REVIEWS),
                                 created_at=datetime.combine(co, datetime.min.time()) + timedelta(days=1)))

    def book(l, gst, off, n):
        nonlocal code
        ci = today + timedelta(days=off); co = ci + timedelta(days=n)
        sub = n * l.price_per_night; sv = round(sub * .14)
        db.add(models.Booking(listing_id=l.id, guest_id=gst.id, check_in=ci, check_out=co, guests=2, nights=n,
                              subtotal=sub, cleaning_fee=l.cleaning_fee, service_fee=sv,
                              total=sub + l.cleaning_fee + sv, confirmation_code=f"HM{code:06d}"))
        code += 1

    # Demo guest: one upcoming trip, two completed (unreviewed) trips
    book(listings[0], guests[0], 21, 4); book(listings[3], guests[0], -40, 3); book(listings[7], guests[0], -90, 5)
    # Other upcoming bookings that block dates
    for j in range(1, 14):
        l = rnd.choice(listings)
        try: book(l, rnd.choice(guests[1:]), rnd.randint(5, 80), rnd.randint(2, 6))
        except Exception: pass
    db.flush()
    for gl in (listings[1], listings[4], listings[9]):
        db.add(models.Wishlist(user_id=guests[0].id, listing_id=gl.id))
    db.commit()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as s:
        seed_if_empty(s)
    print("Seeded.")
