import type { ListingCardT } from "@/lib/types";
import ListingCard from "./ListingCard";

export function SkeletonGrid({ n = 8 }: { n?: number }) {
  return <div className="grid">{Array.from({ length: n }, (_, i) => <div key={i} className="card"><div className="skel media" /><div className="skel line" /><div className="skel line short" /></div>)}</div>;
}

export default function ListingGrid({ items, query, onUnwish }: { items: ListingCardT[]; query?: string; onUnwish?: (id: number) => void }) {
  return <div className="grid">{items.map((l) => <ListingCard key={l.id} l={l} query={query} onUnwish={onUnwish} />)}</div>;
}
