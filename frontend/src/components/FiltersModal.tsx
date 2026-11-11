"use client";
import { useState } from "react";
import Modal from "./Modal";
import type { Meta } from "@/lib/types";

export interface FilterState { min_price: string; max_price: string; property_type: string[]; amenities: string[]; bedrooms: number }
export const EMPTY_FILTERS: FilterState = { min_price: "", max_price: "", property_type: [], amenities: [], bedrooms: 0 };

export default function FiltersModal({ meta, value, onApply, onClose }: { meta: Meta; value: FilterState; onApply: (f: FilterState) => void; onClose: () => void }) {
  const [f, setF] = useState(value);
  const toggle = (k: "property_type" | "amenities", v: string) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  return (
    <Modal title="Filters" wide onClose={onClose} footer={
      <div className="row between">
        <button className="link" onClick={() => setF(EMPTY_FILTERS)}>Clear all</button>
        <button className="btn dark" onClick={() => onApply(f)}>Show places</button>
      </div>}>
      <section className="fsec"><h3>Price range</h3><p className="muted">Nightly prices before fees</p>
        <div className="row gap">
          <label className="field"><span>Minimum</span><input type="number" min={0} placeholder="$0" value={f.min_price} onChange={(e) => setF({ ...f, min_price: e.target.value })} /></label>
          <span>–</span>
          <label className="field"><span>Maximum</span><input type="number" min={0} placeholder="$1000+" value={f.max_price} onChange={(e) => setF({ ...f, max_price: e.target.value })} /></label>
        </div></section>
      <section className="fsec"><h3>Type of place</h3>
        <div className="chips">{meta.property_types.map((t) => <button key={t} className={`chip ${f.property_type.includes(t) ? "on" : ""}`} onClick={() => toggle("property_type", t)}>{t}</button>)}</div></section>
      <section className="fsec"><h3>Bedrooms</h3>
        <div className="chips">{[0, 1, 2, 3, 4, 5].map((n) => <button key={n} className={`chip ${f.bedrooms === n ? "on" : ""}`} onClick={() => setF({ ...f, bedrooms: n })}>{n === 0 ? "Any" : n === 5 ? "5+" : n}</button>)}</div></section>
      <section className="fsec"><h3>Amenities</h3>
        <div className="amen-grid">{meta.amenities.map((a) => (
          <label key={a.name} className="check"><input type="checkbox" checked={f.amenities.includes(a.name)} onChange={() => toggle("amenities", a.name)} />{a.icon} {a.name}</label>))}</div></section>
    </Modal>
  );
}
