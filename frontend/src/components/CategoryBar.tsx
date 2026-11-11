"use client";
import { useRef } from "react";
import type { Meta } from "@/lib/types";

export default function CategoryBar({ meta, active, onSelect, onFilters, filterCount }:
  { meta: Meta | null; active: string; onSelect: (c: string) => void; onFilters: () => void; filterCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="catbar">
      <button className="cat-scroll" aria-label="Scroll left" onClick={() => ref.current?.scrollBy({ left: -400, behavior: "smooth" })}>‹</button>
      <div className="cats" ref={ref}>
        {meta?.categories.map((c) => (
          <button key={c.name} className={`cat ${active === c.name ? "active" : ""}`} onClick={() => onSelect(active === c.name ? "" : c.name)}>
            <span className="cat-icon">{c.icon}</span><span>{c.name}</span>
          </button>
        ))}
      </div>
      <button className="cat-scroll r" aria-label="Scroll right" onClick={() => ref.current?.scrollBy({ left: 400, behavior: "smooth" })}>›</button>
      <button className="filters-btn" onClick={onFilters}>⚙ Filters{filterCount > 0 && <em>{filterCount}</em>}</button>
    </div>
  );
}
