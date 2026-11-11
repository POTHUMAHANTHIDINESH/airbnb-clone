"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";
import RequireAuth from "@/components/RequireAuth";
import Modal from "@/components/Modal";
import { useAuth, useToast } from "@/components/Providers";
import { fallbackImg, fmt, imgUrl, money } from "@/lib/utils";

function ReviewModal({ b, onClose, onDone }: { b: Booking; onClose: () => void; onDone: () => void }) {
  const toast = useToast(); const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await api("/api/reviews", { body: { booking_id: b.id, rating, comment } }); toast("Thanks for your review!"); onDone(); }
    catch (e: any) { toast(e.message, "err"); }
    setBusy(false);
  };
  return (
    <Modal title="Leave a review" onClose={onClose} footer={<button className="btn dark" disabled={busy || comment.length < 3} onClick={submit}>Submit review</button>}>
      <h3 style={{ marginTop: 0 }}>How was {b.listing.title}?</h3>
      <div className="stars big" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={n <= rating ? "on" : ""}>★</button>)}</div>
      <label className="field" style={{ marginTop: 16 }}><span>Your experience</span><textarea rows={5} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
    </Modal>
  );
}

function Trips() {
  const { user } = useAuth(); const toast = useToast();
  const [trips, setTrips] = useState<Booking[] | null>(null); const [review, setReview] = useState<Booking | null>(null);
  const load = () => api<Booking[]>("/api/bookings/mine").then(setTrips);
  useEffect(() => { load(); }, [user?.id]);
  const cancel = async (b: Booking) => {
    if (!confirm("Cancel this reservation?")) return;
    try { await api(`/api/bookings/${b.id}/cancel`, { method: "POST" }); toast("Reservation cancelled"); load(); } catch (e: any) { toast(e.message, "err"); }
  };
  const upcoming = trips?.filter((t) => !t.past && t.status === "confirmed") ?? [];
  const past = trips?.filter((t) => t.past || t.status !== "confirmed") ?? [];

  const Row = ({ b }: { b: Booking }) => (
    <div className="trip">
      <Link href={`/listings/${b.listing.id}`}><img src={imgUrl(b.listing.photo)} alt="" onError={fallbackImg} /></Link>
      <div className="trip-info">
        <div className="row between"><h3>{b.listing.city}, {b.listing.country}</h3>
          {b.status === "cancelled" ? <span className="tag red">Cancelled</span> : b.past ? <span className="tag">Completed</span> : <span className="tag green">Confirmed</span>}</div>
        <div>{b.listing.title}</div>
        <div className="muted">{fmt(b.check_in)} – {fmt(b.check_out, { month: "short", day: "numeric", year: "numeric" })} · {b.guests} guest{b.guests > 1 ? "s" : ""} · {money(b.total)}</div>
        <div className="muted small">Confirmation code {b.code}</div>
        <div className="row gap" style={{ marginTop: 10 }}>
          <Link className="btn outline sm" href={`/listings/${b.listing.id}`}>View listing</Link>
          {!b.past && b.status === "confirmed" && <button className="btn outline sm" onClick={() => cancel(b)}>Cancel</button>}
          {b.past && b.status === "confirmed" && !b.reviewed && <button className="btn dark sm" onClick={() => setReview(b)}>Leave a review</button>}
          {b.reviewed && <span className="muted small">✓ Reviewed</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container narrow">
      <h1>Trips</h1>
      {!trips && <div className="skel line" />}
      {trips && trips.length === 0 && <div className="empty"><h2>No trips booked… yet!</h2><p className="muted">Time to dust off your bags and start planning your next adventure.</p><Link href="/" className="btn dark">Start searching</Link></div>}
      {upcoming.length > 0 && <><h2>Upcoming</h2>{upcoming.map((b) => <Row key={b.id} b={b} />)}</>}
      {past.length > 0 && <><h2>Where you've been</h2>{past.map((b) => <Row key={b.id} b={b} />)}</>}
      {review && <ReviewModal b={review} onClose={() => setReview(null)} onDone={() => { setReview(null); load(); }} />}
    </div>
  );
}
export default function Page() { return <RequireAuth><Trips /></RequireAuth>; }
