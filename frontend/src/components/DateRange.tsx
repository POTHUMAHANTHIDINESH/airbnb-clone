"use client";
import { useMemo, useState } from "react";
import { addDays, iso, parse, todayIso } from "@/lib/utils";

export type Range = { check_in: string; check_out: string };
const WD = ["S", "M", "T", "W", "T", "F", "S"];

interface Props { start: string; end: string; onChange: (s: string, e: string) => void; booked?: Range[]; months?: number }

/** Two-month range picker. Booked ranges are half-open [check_in, check_out): the check-out day itself stays selectable. */
export default function DateRange({ start, end, onChange, booked = [], months = 2 }: Props) {
  const [cursor, setCursor] = useState(() => { const d = start ? parse(start) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [hover, setHover] = useState("");
  const today = todayIso();

  const nightBlocked = useMemo(() => (d: string) => d < today || booked.some((b) => d >= b.check_in && d < b.check_out), [booked, today]);
  const validCheckout = (d: string) => { // no blocked night in [start, d)
    if (d <= start) return false;
    for (let x = start; x < d; x = addDays(x, 1)) if (nightBlocked(x)) return false;
    return true;
  };
  const selectingEnd = !!start && !end;
  const disabled = (d: string) => (selectingEnd && d > start ? !validCheckout(d) : nightBlocked(d));

  const click = (d: string) => {
    if (disabled(d)) return;
    if (!selectingEnd) return onChange(d, "");
    if (d <= start) return onChange(d, "");
    onChange(start, d);
  };

  const render = (offset: number) => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = Array(first.getDay()).fill(null);
    for (let i = 1; i <= days; i++) cells.push(iso(new Date(first.getFullYear(), first.getMonth(), i)));
    return (
      <div className="cal-month" key={offset}>
        <div className="cal-title">{first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
        <div className="cal-grid">
          {WD.map((w, i) => <span key={i} className="cal-wd">{w}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const dis = disabled(d);
            const hi = selectingEnd && hover > start && d > start && d <= hover && !dis;
            const cls = ["cal-day", dis && "dis", d === start && "sel", d === end && "sel", ((start && end && d > start && d < end) || hi) && "in", d === today && "today"].filter(Boolean).join(" ");
            return <button type="button" key={i} className={cls} disabled={dis} onClick={() => click(d)}
              onMouseEnter={() => setHover(d)} aria-label={d}>{parse(d).getDate()}</button>;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="cal">
      <button type="button" className="cal-nav l" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button>
      <button type="button" className="cal-nav r" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
      <div className="cal-months">{Array.from({ length: months }, (_, i) => render(i))}</div>
    </div>
  );
}
