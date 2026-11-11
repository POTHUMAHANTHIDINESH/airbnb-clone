"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ListingCardT } from "@/lib/types";
import RequireAuth from "@/components/RequireAuth";
import ListingGrid, { SkeletonGrid } from "@/components/ListingGrid";
import { useAuth } from "@/components/Providers";

function Wishlist() {
  const { user } = useAuth(); const [items, setItems] = useState<ListingCardT[] | null>(null);
  useEffect(() => { api<ListingCardT[]>("/api/wishlist").then(setItems); }, [user?.id]);
  return (
    <div className="container">
      <h1>Wishlists</h1>
      {!items && <SkeletonGrid n={4} />}
      {items?.length === 0 && <div className="empty"><h2>Create your first wishlist</h2><p className="muted">As you search, tap the heart icon to save your favourite places.</p><Link href="/" className="btn dark">Start exploring</Link></div>}
      {items && items.length > 0 && <ListingGrid items={items} onUnwish={(id) => setItems((xs) => xs!.filter((x) => x.id !== id))} />}
    </div>
  );
}
export default function Page() { return <RequireAuth><Wishlist /></RequireAuth>; }
