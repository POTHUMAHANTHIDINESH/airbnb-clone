"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Booking, ListingCardT } from "@/lib/types";
import RequireAuth from "@/components/RequireAuth";
import { useAuth, useToast } from "@/components/Providers";
import { fallbackImg, fmt, imgUrl, money } from "@/lib/utils";

function Dashboard() {
  const { user } = useAuth(); const toast = useToast();
  const [listings, setListings] = useState<ListingCardT[] | null>(null); const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"listings" | "bookings">("listings");
  const load = () => { api<ListingCardT[]>("/api/host/listings").then(setListings); api<Booking[]>("/api/host/bookings").then(setBookings); };
  useEffect(load, [user?.id]);
  const del = async (l: ListingCardT) => {
    if (!confirm(`Delete “${l.title}”? Its bookings and reviews will be removed too.`)) return;
    try { await api(`/api/host/listings/${l.id}`, { method: "DELETE" }); toast("Listing deleted"); load(); } catch (e: any) { toast(e.message, "err"); }
  };
  const active = bookings.filter((b) => b.status === "confirmed");
  const upcoming = active.filter((b) => !b.past);
  const earnings = active.reduce((s, b) => s + b.subtotal, 0);

  return (
    <div className="container">
      <div className="row between"><h1>Welcome back, {user?.name.split(" ")[0]}</h1><Link href="/host/new" className="btn primary">+ Create listing</Link></div>
      <div className="stats">
        <div><span className="muted">Listings</span><b>{listings?.length ?? "–"}</b></div>
        <div><span className="muted">Upcoming reservations</span><b>{upcoming.length}</b></div>
        <div><span className="muted">Total bookings</span><b>{active.length}</b></div>
        <div><span className="muted">Booked revenue</span><b>{money(earnings)}</b></div>
      </div>
      <div className="tabs"><button className={tab === "listings" ? "on" : ""} onClick={() => setTab("listings")}>Your listings</button>
        <button className={tab === "bookings" ? "on" : ""} onClick={() => setTab("bookings")}>Reservations ({bookings.length})</button></div>
      {tab === "listings" && (<>
        {listings?.length === 0 && <div className="empty"><h2>No listings yet</h2><Link href="/host/new" className="btn dark">Create your first listing</Link></div>}
        <div className="table">{listings?.map((l) => (
          <div key={l.id} className="trip">
            <Link href={`/listings/${l.id}`}><img src={imgUrl(l.photos[0])} alt="" onError={fallbackImg} /></Link>
            <div className="trip-info"><h3>{l.title}</h3><div className="muted">{l.city}, {l.country} · {l.property_type} · {money(l.price_per_night)}/night</div>
              <div className="muted small">{l.review_count ? `★ ${l.rating.toFixed(2)} (${l.review_count} reviews)` : "No reviews yet"}</div>
              <div className="row gap" style={{ marginTop: 10 }}><Link className="btn outline sm" href={`/host/${l.id}/edit`}>Edit</Link>
                <Link className="btn outline sm" href={`/listings/${l.id}`}>View</Link><button className="btn outline sm danger" onClick={() => del(l)}>Delete</button></div></div>
          </div>))}</div></>)}
      {tab === "bookings" && (<>
        {bookings.length === 0 && <div className="empty"><h2>No reservations yet</h2></div>}
        <div className="table">{bookings.map((b) => (
          <div key={b.id} className="booking-row">
            <img className="avatar" src={b.guest.avatar} alt="" /><div className="grow"><b>{b.guest.name}</b><div className="muted small">{b.listing.title}</div></div>
            <div>{fmt(b.check_in)} – {fmt(b.check_out)}<div className="muted small">{b.nights} nights · {b.guests} guests</div></div>
            <div><b>{money(b.subtotal)}</b><div className="muted small">{b.code}</div></div>
            <span className={`tag ${b.status === "cancelled" ? "red" : b.past ? "" : "green"}`}>{b.status === "cancelled" ? "Cancelled" : b.past ? "Completed" : "Upcoming"}</span>
          </div>))}</div></>)}
    </div>
  );
}
export default function Page() { return <RequireAuth host><Dashboard /></RequireAuth>; }
