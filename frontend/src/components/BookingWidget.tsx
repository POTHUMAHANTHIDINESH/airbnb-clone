"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ListingDetail, Quote } from "@/lib/types";
import DateRange, { Range } from "./DateRange";
import Stepper from "./Stepper";
import CheckoutModal, { PriceBreakdown } from "./CheckoutModal";
import { useAuth } from "./Providers";
import { fmt, money, nightsBetween } from "@/lib/utils";

interface Props { listing: ListingDetail; booked: Range[]; ci: string; co: string; setDates: (s: string, e: string) => void; guests: number; setGuests: (n: number) => void; onBooked: () => void }

export default function BookingWidget({ listing, booked, ci, co, setDates, guests, setGuests, onBooked }: Props) {
  const { user, requireAuth } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null); const [err, setErr] = useState("");
  const [pop, setPop] = useState<"dates" | "guests" | null>(null); const [checkout, setCheckout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const own = user?.id === listing.host.id;

  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setPop(null);
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    setQuote(null); setErr("");
    if (!ci || !co) return;
    api<Quote>(`/api/listings/${listing.id}/quote?check_in=${ci}&check_out=${co}&guests=${guests}`)
      .then((q) => { setQuote(q); if (!q.available) setErr("Those dates are no longer available"); }).catch((e) => setErr(e.message));
  }, [ci, co, guests, listing.id, booked]);

  const reserve = () => { if (!ci || !co) return setPop("dates"); requireAuth(() => setCheckout(true)); };

  return (
    <div className="book-card" ref={ref}>
      <div className="row between baseline"><div><b className="big">{money(listing.price_per_night)}</b> <span>night</span></div>
        {listing.review_count > 0 && <span className="small">★ {listing.rating.toFixed(2)} · {listing.review_count} reviews</span>}</div>
      <div className="book-box">
        <button className="bb-dates" onClick={() => setPop("dates")}>
          <div><small>CHECK-IN</small><span>{ci ? fmt(ci, { month: "numeric", day: "numeric", year: "numeric" }) : "Add date"}</span></div>
          <div><small>CHECKOUT</small><span>{co ? fmt(co, { month: "numeric", day: "numeric", year: "numeric" }) : "Add date"}</span></div>
        </button>
        <button className="bb-guests" onClick={() => setPop("guests")}><small>GUESTS</small><span>{guests} guest{guests > 1 ? "s" : ""}</span></button>
        {pop === "dates" && <div className="popover cal-pop book-pop"><DateRange start={ci} end={co} onChange={(s, e) => { setDates(s, e); if (e) setPop(null); }} booked={booked} months={1} />
          <div className="right"><button className="link" onClick={() => setDates("", "")}>Clear dates</button></div></div>}
        {pop === "guests" && <div className="popover book-pop"><div className="row between"><div><b>Guests</b><div className="muted small">Max {listing.max_guests}</div></div>
          <Stepper value={guests} min={1} max={listing.max_guests} onChange={setGuests} /></div></div>}
      </div>
      {own ? <p className="muted center">This is your listing.</p> :
        <button className="btn primary block" onClick={reserve} disabled={!!err || (!!ci && !!co && !quote)}>{ci && co ? "Reserve" : "Check availability"}</button>}
      {err && <p className="error center">{err}</p>}
      {quote && !err && <><p className="muted center small">You won't be charged yet</p><PriceBreakdown q={quote} nightly={listing.price_per_night} /></>}
      {checkout && quote && <CheckoutModal listing={listing} ci={ci} co={co} guests={guests} quote={quote} onClose={() => setCheckout(false)} onBooked={onBooked} />}
    </div>
  );
}
