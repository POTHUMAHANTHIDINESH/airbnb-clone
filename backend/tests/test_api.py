import os, tempfile
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/t.db"
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

def login(c, email):
    r = c.post("/api/auth/login", json={"email": email, "password": "password123"}); assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}

def test_flow():
    with TestClient(app) as c:
        assert c.get("/api/listings").json()["total"] >= 30
        assert c.get("/api/listings?q=lisbon").json()["total"] == 1
        assert c.get("/api/listings?min_price=400&max_price=900").json()["total"] > 0
        g = login(c, "sam@demo.com")
        ci = date.today() + timedelta(days=200); co = ci + timedelta(days=3)
        body = dict(listing_id=2, check_in=str(ci), check_out=str(co), guests=2)
        r = c.post("/api/bookings", json=body, headers=g); assert r.status_code == 201, r.text
        assert r.json()["total"] == r.json()["subtotal"] + r.json()["cleaning_fee"] + r.json()["service_fee"]
        # overlapping dates are rejected, and the listing disappears from date-filtered search
        assert c.post("/api/bookings", json=body, headers=g).status_code == 409
        ids = [i["id"] for i in c.get(f"/api/listings?check_in={ci}&check_out={co}&page_size=48").json()["items"]]
        assert 2 not in ids
        # same-day turnover is allowed
        body2 = dict(body, check_in=str(co), check_out=str(co + timedelta(days=2)))
        assert c.post("/api/bookings", json=body2, headers=g).status_code == 201
        assert c.post("/api/bookings", json=dict(body, guests=99), headers=g).status_code == 422
        assert c.get("/api/bookings/mine", headers=g).json()
        assert c.get("/api/bookings/mine").status_code == 401

def test_host_crud_and_reviews():
    with TestClient(app) as c:
        h = login(c, "host@demo.com"); g = login(c, "guest@demo.com")
        assert c.post("/api/host/listings", json={}, headers=g).status_code in (403, 422)
        new = dict(title="Test place here", description="x" * 30, property_type="House", category="Cabins",
                   city="Testville", country="Nowhere", price_per_night=99, max_guests=2, photos=["http://x/y.jpg"],
                   amenities=["Wifi"])
        r = c.post("/api/host/listings", json=new, headers=h); assert r.status_code == 201
        lid = r.json()["id"]
        assert c.put(f"/api/host/listings/{lid}", json=dict(new, price_per_night=120), headers=h).status_code == 200
        assert c.get(f"/api/listings/{lid}").json()["price_per_night"] == 120
        assert c.delete(f"/api/host/listings/{lid}", headers=g).status_code in (403, 404)
        assert c.delete(f"/api/host/listings/{lid}", headers=h).status_code == 204
        assert c.get(f"/api/listings/{lid}").status_code == 404
        trips = c.get("/api/bookings/mine", headers=g).json()
        past = next(t for t in trips if t["past"] and not t["reviewed"])
        assert c.post("/api/reviews", json=dict(booking_id=past["id"], rating=5, comment="Great!"), headers=g).status_code == 201
        assert c.post("/api/reviews", json=dict(booking_id=past["id"], rating=5, comment="Great!"), headers=g).status_code == 409
        upcoming = next(t for t in trips if not t["past"])
        assert c.post("/api/reviews", json=dict(booking_id=upcoming["id"], rating=5, comment="Early"), headers=g).status_code == 422

def test_wishlist():
    with TestClient(app) as c:
        g = login(c, "sam@demo.com")
        assert c.post("/api/wishlist/5", headers=g).status_code == 201
        assert [l["id"] for l in c.get("/api/wishlist", headers=g).json()] == [5]
        c.delete("/api/wishlist/5", headers=g); assert c.get("/api/wishlist", headers=g).json() == []
