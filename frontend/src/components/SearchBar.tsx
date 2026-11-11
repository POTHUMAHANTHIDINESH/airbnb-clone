"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DateRange from "./DateRange";
import Stepper from "./Stepper";
import { fmt } from "@/lib/utils";

const DESTINATIONS = [["Lisbon", "Portugal"], ["Tokyo", "Japan"], ["Santorini", "Greece"], ["Malibu", "United States"], ["Goa", "India"], ["Paris", "France"]];
type Panel = "where" | "dates" | "guests" | null;

export default function SearchBar({ stacked = false, onDone }: { stacked?: boolean; onDone?: () => void }) {
  const router = useRouter(); const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || ""); const [ci, setCi] = useState(sp.get("check_in") || "");
  const [co, setCo] = useState(sp.get("check_out") || ""); const [guests, setGuests] = useState(Number(sp.get("guests")) || 0);
  const [open, setOpen] = useState<Panel>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(null);
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = () => {
    const p = new URLSearchParams(sp.toString());
    const set = (k: string, v: string) => (v ? p.set(k, v) : p.delete(k));
    set("q", q.trim()); set("check_in", ci); set("check_out", co); set("guests", guests ? String(guests) : ""); p.delete("page");
    setOpen(null); onDone?.(); router.push("/?" + p.toString());
  };

  const seg = (id: Panel, label: string, value: string, placeholder: string) => (
    <button type="button" className={`seg ${open === id ? "active" : ""}`} onClick={() => setOpen(id)}>
      <b>{label}</b><span className={value ? "" : "ph"}>{value || placeholder}</span>
    </button>
  );

  return (
    <div className={`searchbar ${stacked ? "stacked" : ""}`} ref={ref}>
      <div className="seg-wrap grow">
        {open === "where" ? (
          <div className="seg active"><b>Where</b>
            <input autoFocus placeholder="Search destinations" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
          </div>
        ) : seg("where", "Where", q, "Search destinations")}
        {open === "where" && (
          <div className="popover" style={{ width: 360 }}>
            <p className="muted small" style={{ margin: "0 0 8px" }}>Suggested destinations</p>
            {DESTINATIONS.map(([c, k]) => (
              <button key={c} type="button" className="dest" onClick={() => { setQ(c); setOpen("dates"); }}>
                <span className="dest-icon">📍</span><span>{c}, {k}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <i className="sep" />
      <div className="seg-wrap">
        {seg("dates", "Check in", fmt(ci), "Add dates")}
      </div>
      <i className="sep" />
      <div className="seg-wrap">
        {seg("dates", "Check out", fmt(co), "Add dates")}
        {open === "dates" && (
          <div className="popover cal-pop">
            <DateRange start={ci} end={co} onChange={(s, e) => { setCi(s); setCo(e); if (e) setOpen("guests"); }} months={stacked ? 1 : 2} />
            <div className="right"><button type="button" className="link" onClick={() => { setCi(""); setCo(""); }}>Clear dates</button></div>
          </div>
        )}
      </div>
      <i className="sep" />
      <div className="seg-wrap grow">
        {seg("guests", "Who", guests ? `${guests} guest${guests > 1 ? "s" : ""}` : "", "Add guests")}
        {open === "guests" && (
          <div className="popover right-pop" style={{ width: 320 }}>
            <div className="row between"><div><b>Guests</b><div className="muted small">Ages 13 or above</div></div>
              <Stepper value={guests} onChange={setGuests} max={16} /></div>
          </div>
        )}
      </div>
      <button type="button" className="search-go" onClick={go} aria-label="Search">
        <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="#fff" strokeWidth="4"><circle cx="13" cy="13" r="9" /><path d="m27 27-6-6" /></svg>
        {open && <span>Search</span>}
      </button>
    </div>
  );
}
