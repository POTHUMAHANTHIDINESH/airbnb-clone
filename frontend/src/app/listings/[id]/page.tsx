"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ListingDetail, Review } from "@/lib/types";
import Gallery from "@/components/Gallery";
import Heart from "@/components/Heart";
import BookingWidget from "@/components/BookingWidget";
import ReviewsSection from "@/components/ReviewsSection";
import DateRange, { Range } from "@/components/DateRange";
import MapView from "@/components/MapView";
import { useAuth } from "@/components/Providers";
import { fmt, nightsBetween } from "@/lib/utils";

function Detail() {
  const { id } = useParams<{ id: string }>(); const sp = useSearchParams(); const { user } = useAuth();
  const [l, setL] = useState<ListingDetail | null>(null); const [err, setErr] = useState("");
  const [booked, setBooked] = useState<Range[]>([]); const [reviews, setReviews] = useState<Review[]>([]);
  const [ci, setCi] = useState(sp.get("check_in") || ""); const [co, setCo] = useState(sp.get("check_out") || "");
  const [guests, setGuests] = useState(Number(sp.get("guests")) || 1);

  const loadAvail = useCallback(() => api<{ booked: Range[] }>(`/api/listings/${id}/availability`).then((r) => setBooked(r.booked)), [id]);
  useEffect(() => {
    api<ListingDetail>(`/api/listings/${id}`).then(setL).catch((e) => setErr(e.message));
    api<Review[]>(`/api/listings/${id}/reviews`).then(setReviews).catch(() => {});
    loadAvail();
  }, [id, user?.id, loadAvail]);
  const pins = useMemo(() => (l ? [{ lat: l.lat, lng: l.lng, label: "🏠" }] : []), [l]);

  if (err) return <div className="container empty"><h2>{err}</h2></div>;
  if (!l) return <div className="container"><div className="skel line" style={{ height: 32, width: "50%" }} /><div className="skel media" style={{ height: 400, marginTop: 16 }} /></div>;
  const setDates = (s: string, e: string) => { setCi(s); setCo(e); };

  return (
    <div className="container detail">
      <h1 className="d-title">{l.title}</h1>
      <div className="row between" style={{ marginBottom: 16 }}>
        <span className="small"><b>★ {l.review_count ? l.rating.toFixed(2) : "New"}</b>{l.review_count > 0 && <> · <a href="#reviews" className="underline">{l.review_count} reviews</a></>} · <b className="underline">{l.city}, {l.country}</b></span>
        <span className="row gap small"><button className="link" onClick={() => navigator.clipboard?.writeText(location.href)}>⤴ Share</button>
          <span className="heart-inline"><Heart id={l.id} wished={l.wished} /></span></span>
      </div>
      <Gallery photos={l.photos} title={l.title} />
      <div className="d-cols">
        <div>
          <section className="section row between"><div><h2>{l.property_type} in {l.city}, {l.country}</h2>
            <p className="muted">{l.max_guests} guests · {l.bedrooms} bedroom{l.bedrooms === 1 ? "" : "s"} · {l.beds} bed{l.beds === 1 ? "" : "s"} · {l.baths} bath{l.baths === 1 ? "" : "s"}</p></div>
            <img className="avatar lg" src={l.host.avatar} alt={l.host.name} /></section>
          <section className="section row gap"><span style={{ fontSize: 26 }}>{l.superhost ? "🏅" : "🔑"}</span><div><b>Hosted by {l.host.name}</b>
            <div className="muted small">{l.superhost ? "Superhost · " : ""}Hosting since {l.host.joined}</div></div></section>
          <section className="section"><h2 className="sr">About this place</h2><p className="pre">{l.description}</p></section>
          <section className="section"><h2>What this place offers</h2>
            <div className="amen-grid">{l.amenities.map((a) => <div key={a.name} className="amen"><span>{a.icon}</span>{a.name}</div>)}</div></section>
          <section className="section"><h2>{ci && co ? `${nightsBetween(ci, co)} nights in ${l.city}` : "Select check-in date"}</h2>
            <p className="muted small">{ci && co ? `${fmt(ci, { month: "short", day: "numeric", year: "numeric" })} – ${fmt(co, { month: "short", day: "numeric", year: "numeric" })}` : "Add your travel dates for exact pricing"}</p>
            <DateRange start={ci} end={co} onChange={setDates} booked={booked} /></section>
          <ReviewsSection reviews={reviews} rating={l.rating} />
          <section className="section"><h2>Where you'll be</h2><p className="muted">{l.address}</p><MapView pins={pins} /></section>
          <section className="section"><h2>Meet your host</h2><div className="host-card row gap"><img className="avatar xl" src={l.host.avatar} alt="" /><div><b style={{ fontSize: 20 }}>{l.host.name}</b><p className="muted">{l.host.bio}</p>
            <button className="btn outline" disabled title="Coming soon">Message host · Coming soon</button></div></div></section>
        </div>
        <aside><BookingWidget listing={l} booked={booked} ci={ci} co={co} setDates={setDates} guests={guests} setGuests={setGuests} onBooked={() => { loadAvail(); setDates("", ""); }} /></aside>
      </div>
    </div>
  );
}
export default function Page() { return <Suspense><Detail /></Suspense>; }
