"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ListingCardT, Meta } from "@/lib/types";
import CategoryBar from "@/components/CategoryBar";
import FiltersModal, { EMPTY_FILTERS, FilterState } from "@/components/FiltersModal";
import ListingGrid, { SkeletonGrid } from "@/components/ListingGrid";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/components/Providers";

function Explore() {
  const sp = useSearchParams(); const router = useRouter(); const { user } = useAuth();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [data, setData] = useState<{ items: ListingCardT[]; total: number; pages: number } | null>(null);
  const [err, setErr] = useState(""); const [showFilters, setShowFilters] = useState(false);

  const page = Number(sp.get("page")) || 1; const category = sp.get("category") || "";
  const filters: FilterState = { min_price: sp.get("min_price") || "", max_price: sp.get("max_price") || "", property_type: sp.getAll("property_type"),
    amenities: sp.getAll("amenities"), bedrooms: Number(sp.get("bedrooms")) || 0 };
  const filterCount = (filters.min_price || filters.max_price ? 1 : 0) + filters.property_type.length + filters.amenities.length + (filters.bedrooms ? 1 : 0);

  const update = (mut: (p: URLSearchParams) => void) => { const p = new URLSearchParams(sp.toString()); mut(p); router.push("/?" + p.toString()); };
  useEffect(() => { api<Meta>("/api/meta").then(setMeta).catch(() => {}); }, []);
  useEffect(() => {
    setData(null); setErr("");
    api(`/api/listings?${sp.toString()}`).then(setData).catch((e) => setErr(e.message));
    window.scrollTo({ top: 0 });
  }, [sp, user?.id]);

  const apply = (f: FilterState) => update((p) => {
    ["min_price", "max_price", "bedrooms", "property_type", "amenities", "page"].forEach((k) => p.delete(k));
    if (f.min_price) p.set("min_price", f.min_price); if (f.max_price) p.set("max_price", f.max_price);
    if (f.bedrooms) p.set("bedrooms", String(f.bedrooms));
    f.property_type.forEach((t) => p.append("property_type", t)); f.amenities.forEach((a) => p.append("amenities", a));
    setShowFilters(false);
  });
  const dateQuery = sp.get("check_in") && sp.get("check_out") ? `?check_in=${sp.get("check_in")}&check_out=${sp.get("check_out")}&guests=${sp.get("guests") || 1}` : "";

  return (
    <>
      <CategoryBar meta={meta} active={category} filterCount={filterCount} onFilters={() => setShowFilters(true)}
        onSelect={(c) => update((p) => { c ? p.set("category", c) : p.delete("category"); p.delete("page"); })} />
      <div className="container">
        <div className="row between results-bar">
          <span className="muted">{data ? `${data.total} place${data.total === 1 ? "" : "s"}${sp.get("q") ? ` in “${sp.get("q")}”` : ""}` : "Loading…"}</span>
          <select className="select" value={sp.get("sort") || "recommended"} onChange={(e) => update((p) => { p.set("sort", e.target.value); p.delete("page"); })} aria-label="Sort">
            <option value="recommended">Recommended</option><option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option><option value="newest">Newest</option>
          </select>
        </div>
        {err && <p className="error">{err}. Is the backend running on port 8000?</p>}
        {!data && !err && <SkeletonGrid />}
        {data && data.items.length === 0 && (
          <div className="empty"><h2>No exact matches</h2><p className="muted">Try changing or removing some of your filters or dates.</p>
            <button className="btn dark" onClick={() => router.push("/")}>Clear everything</button></div>)}
        {data && data.items.length > 0 && <ListingGrid items={data.items} query={dateQuery} />}
        {data && <Pagination page={page} pages={data.pages} onPage={(n) => update((p) => p.set("page", String(n)))} />}
      </div>
      {showFilters && meta && <FiltersModal meta={meta} value={filters} onApply={apply} onClose={() => setShowFilters(false)} />}
    </>
  );
}

export default function Home() { return <Suspense fallback={<div className="container"><SkeletonGrid /></div>}><Explore /></Suspense>; }
