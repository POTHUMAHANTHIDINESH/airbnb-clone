"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ListingDetail, Meta } from "@/lib/types";
import Stepper from "./Stepper";
import { useToast } from "./Providers";
import { fallbackImg, imgUrl } from "@/lib/utils";

const blank = { title: "", description: "", property_type: "House", category: "Amazing views", city: "", country: "", address: "", lat: 0, lng: 0,
  price_per_night: 120, cleaning_fee: 40, max_guests: 2, bedrooms: 1, beds: 1, baths: 1, amenities: ["Wifi"] as string[], photos: [] as string[] };

/** Create / edit form for hosts. `initial` => edit mode (PUT), otherwise create (POST). */
export default function ListingForm({ initial }: { initial?: ListingDetail }) {
  const router = useRouter(); const toast = useToast();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [f, setF] = useState(() => initial ? { ...blank, ...initial, amenities: initial.amenities.map((a) => a.name) } : blank);
  const [url, setUrl] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  useEffect(() => { api<Meta>("/api/meta").then(setMeta); }, []);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const upload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const form = new FormData(); form.append("file", file);
      try { const r = await api<{ url: string }>("/api/uploads", { form }); setF((p) => ({ ...p, photos: [...p.photos, r.url] })); }
      catch (e: any) { toast(e.message, "err"); }
    }
  };
  const addUrl = () => { if (/^https?:\/\//.test(url)) { set("photos", [...f.photos, url]); setUrl(""); } else toast("Enter a valid image URL", "err"); };
  const move = (i: number, d: number) => { const p = [...f.photos]; const j = i + d; if (j < 0 || j >= p.length) return; [p[i], p[j]] = [p[j], p[i]]; set("photos", p); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!f.photos.length) return setErr("Add at least one photo");
    setBusy(true);
    try {
      const body = { title: f.title, description: f.description, property_type: f.property_type, category: f.category, city: f.city, country: f.country,
        address: f.address, lat: Number(f.lat), lng: Number(f.lng), price_per_night: Number(f.price_per_night), cleaning_fee: Number(f.cleaning_fee),
        max_guests: f.max_guests, bedrooms: f.bedrooms, beds: f.beds, baths: f.baths, amenities: f.amenities, photos: f.photos };
      if (initial) await api(`/api/host/listings/${initial.id}`, { method: "PUT", body }); else await api("/api/host/listings", { body });
      toast(initial ? "Listing updated" : "Listing published"); router.push("/host");
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <form className="container narrow stack lf" onSubmit={submit}>
      <h1>{initial ? "Edit your listing" : "Create a new listing"}</h1>
      <label className="field"><span>Title</span><input required minLength={5} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Cozy cabin by the lake" /></label>
      <label className="field"><span>Description</span><textarea required minLength={20} rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
      <div className="row gap wrap">
        <label className="field grow"><span>Property type</span><select value={f.property_type} onChange={(e) => set("property_type", e.target.value)}>{meta?.property_types.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="field grow"><span>Category</span><select value={f.category} onChange={(e) => set("category", e.target.value)}>{meta?.categories.map((c) => <option key={c.name}>{c.name}</option>)}</select></label>
      </div>
      <div className="row gap wrap">
        <label className="field grow"><span>City</span><input required value={f.city} onChange={(e) => set("city", e.target.value)} /></label>
        <label className="field grow"><span>Country</span><input required value={f.country} onChange={(e) => set("country", e.target.value)} /></label>
      </div>
      <label className="field"><span>Street address</span><input value={f.address} onChange={(e) => set("address", e.target.value)} /></label>
      <div className="row gap wrap">
        <label className="field grow"><span>Latitude (map pin)</span><input type="number" step="any" value={f.lat} onChange={(e) => set("lat", e.target.value)} /></label>
        <label className="field grow"><span>Longitude</span><input type="number" step="any" value={f.lng} onChange={(e) => set("lng", e.target.value)} /></label>
      </div>
      <div className="row gap wrap">
        <label className="field grow"><span>Price per night (USD)</span><input required type="number" min={1} value={f.price_per_night} onChange={(e) => set("price_per_night", e.target.value)} /></label>
        <label className="field grow"><span>Cleaning fee (USD)</span><input type="number" min={0} value={f.cleaning_fee} onChange={(e) => set("cleaning_fee", e.target.value)} /></label>
      </div>
      <div className="counters">
        {([["Guests", "max_guests", 1], ["Bedrooms", "bedrooms", 0], ["Beds", "beds", 1], ["Bathrooms", "baths", 1]] as const).map(([label, k, min]) => (
          <div key={k} className="row between"><span>{label}</span><Stepper value={(f as any)[k]} min={min} max={20} onChange={(n) => set(k, n)} /></div>))}
      </div>
      <div><b>Amenities</b><div className="amen-grid" style={{ marginTop: 8 }}>{meta?.amenities.map((a) => (
        <label key={a.name} className="check"><input type="checkbox" checked={f.amenities.includes(a.name)}
          onChange={() => set("amenities", f.amenities.includes(a.name) ? f.amenities.filter((x) => x !== a.name) : [...f.amenities, a.name])} />{a.icon} {a.name}</label>))}</div></div>
      <div><b>Photos</b> <span className="muted small">(first photo is the cover)</span>
        <div className="photo-grid">{f.photos.map((p, i) => (
          <div key={p + i} className="ph-item"><img src={imgUrl(p)} alt="" onError={fallbackImg} />
            <div className="ph-actions"><button type="button" onClick={() => move(i, -1)}>←</button><button type="button" onClick={() => move(i, 1)}>→</button>
              <button type="button" onClick={() => set("photos", f.photos.filter((_, k) => k !== i))}>✕</button></div></div>))}</div>
        <div className="row gap wrap" style={{ marginTop: 10 }}>
          <input className="grow input" placeholder="https://… image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="btn outline" onClick={addUrl}>Add URL</button>
          <label className="btn outline">Upload files<input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} /></label>
        </div></div>
      {err && <p className="error">{err}</p>}
      <div className="row gap"><button className="btn primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Publish listing"}</button>
        <button type="button" className="btn outline" onClick={() => router.push("/host")}>Cancel</button></div>
    </form>
  );
}
