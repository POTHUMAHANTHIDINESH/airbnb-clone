"use client";
import { useState } from "react";
import Link from "next/link";
import Modal from "./Modal";
import { api } from "@/lib/api";
import type { Booking, ListingDetail, Quote } from "@/lib/types";
import { fmt, money } from "@/lib/utils";
import { useToast } from "./Providers";

export function PriceBreakdown({ q, nightly }: { q: Quote; nightly: number }) {
  return (
    <div className="breakdown">
      <div className="row between"><span className="underline">{money(nightly)} × {q.nights} night{q.nights > 1 ? "s" : ""}</span><span>{money(q.subtotal)}</span></div>
      <div className="row between"><span className="underline">Cleaning fee</span><span>{money(q.cleaning_fee)}</span></div>
      <div className="row between"><span className="underline">Service fee</span><span>{money(q.service_fee)}</span></div>
      <hr /><div className="row between"><b>Total (USD)</b><b>{money(q.total)}</b></div>
    </div>
  );
}

/** Mocked checkout: nothing is charged; the booking is persisted on confirm. */
export default function CheckoutModal({ listing, ci, co, guests, quote, onClose, onBooked }:
  { listing: ListingDetail; ci: string; co: string; guests: number; quote: Quote; onClose: () => void; onBooked: () => void }) {
  const toast = useToast();
  const [card, setCard] = useState("4242 4242 4242 4242"); const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); const [done, setDone] = useState<Booking | null>(null);

  const pay = async () => {
    if (card.replace(/\s/g, "").length < 12) return setErr("Enter a valid card number");
    setBusy(true); setErr("");
    try {
      await new Promise((r) => setTimeout(r, 700)); // fake payment latency
      const b = await api<Booking>("/api/bookings", { body: { listing_id: listing.id, check_in: ci, check_out: co, guests } });
      setDone(b); onBooked(); toast("Reservation confirmed 🎉");
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };

  if (done) return (
    <Modal title="Reservation confirmed" onClose={onClose}>
      <div className="center stack">
        <div style={{ fontSize: 56 }}>🎉</div><h2 style={{ margin: 0 }}>You're going to {listing.city}!</h2>
        <p className="muted">Confirmation code <b>{done.code}</b></p>
        <p>{fmt(ci, { month: "short", day: "numeric", year: "numeric" })} → {fmt(co, { month: "short", day: "numeric", year: "numeric" })} · {guests} guest{guests > 1 ? "s" : ""}</p>
        <Link href="/trips" className="btn primary" onClick={onClose}>View my trips</Link>
      </div>
    </Modal>
  );

  return (
    <Modal title="Confirm and pay" wide onClose={onClose}>
      <div className="checkout">
        <div className="stack">
          <h3>Your trip</h3>
          <div className="row between"><div><b>Dates</b><div className="muted">{fmt(ci)} – {fmt(co, { month: "short", day: "numeric", year: "numeric" })}</div></div></div>
          <div className="row between"><div><b>Guests</b><div className="muted">{guests} guest{guests > 1 ? "s" : ""}</div></div></div>
          <hr /><h3>Pay with</h3>
          <label className="field"><span>Card number (mock)</span><input value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" /></label>
          <div className="row gap"><label className="field grow"><span>Expiry</span><input defaultValue="12/30" /></label><label className="field grow"><span>CVV</span><input defaultValue="123" /></label></div>
          <p className="muted small">This is a demo. No real payment is processed.</p>
          {err && <p className="error">{err}</p>}
          <button className="btn primary block" disabled={busy} onClick={pay}>{busy ? "Processing…" : `Confirm and pay ${money(quote.total)}`}</button>
        </div>
        <aside className="summary">
          <div className="row gap"><img src={listing.photos[0]} alt="" /><div><b>{listing.title}</b><div className="muted small">{listing.property_type} · {listing.city}</div></div></div>
          <hr /><PriceBreakdown q={quote} nightly={listing.price_per_night} />
        </aside>
      </div>
    </Modal>
  );
}
