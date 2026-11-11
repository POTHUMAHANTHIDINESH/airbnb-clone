"use client";
import Link from "next/link";
import { useState } from "react";
import type { ListingCardT } from "@/lib/types";
import { fallbackImg, imgUrl, money } from "@/lib/utils";
import Heart from "./Heart";

export default function ListingCard({ l, query = "", onUnwish }: { l: ListingCardT; query?: string; onUnwish?: (id: number) => void }) {
  const [i, setI] = useState(0);
  const go = (d: number) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setI((i + d + l.photos.length) % l.photos.length); };
  return (
    <Link href={`/listings/${l.id}${query}`} className="card">
      <div className="card-media">
        <img src={imgUrl(l.photos[i])} alt={l.title} loading="lazy" onError={fallbackImg} />
        {l.superhost && <span className="badge">Guest favourite</span>}
        <Heart id={l.id} wished={l.wished} onChange={(w) => !w && onUnwish?.(l.id)} />
        {l.photos.length > 1 && <>
          {i > 0 && <button className="arrow l" onClick={go(-1)} aria-label="Previous photo">‹</button>}
          {i < l.photos.length - 1 && <button className="arrow r" onClick={go(1)} aria-label="Next photo">›</button>}
          <div className="dots">{l.photos.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
        </>}
      </div>
      <div className="card-info">
        <div className="row between"><b className="ellipsis">{l.city}, {l.country}</b>
          <span className="rating">{l.review_count ? `★ ${l.rating.toFixed(2)}` : "★ New"}</span></div>
        <div className="muted ellipsis">{l.title}</div>
        <div className="muted">{l.bedrooms} bedroom{l.bedrooms === 1 ? "" : "s"} · {l.property_type}</div>
        <div className="price"><b>{money(l.price_per_night)}</b> night</div>
      </div>
    </Link>
  );
}
