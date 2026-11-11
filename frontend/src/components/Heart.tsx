"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth, useToast } from "./Providers";

/** Wishlist toggle with optimistic update. */
export default function Heart({ id, wished, onChange }: { id: number; wished: boolean; onChange?: (w: boolean) => void }) {
  const { requireAuth } = useAuth(); const toast = useToast();
  const [on, setOn] = useState(wished);
  const click = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    requireAuth(async () => {
      const next = !on; setOn(next);
      try { await api(`/api/wishlist/${id}`, { method: next ? "POST" : "DELETE" }); onChange?.(next); toast(next ? "Saved to wishlist" : "Removed from wishlist"); }
      catch (err: any) { setOn(!next); toast(err.message, "err"); }
    });
  };
  return (
    <button className="heart" onClick={click} aria-label={on ? "Remove from wishlist" : "Save to wishlist"} aria-pressed={on}>
      <svg viewBox="0 0 32 32" width="24" height="24" fill={on ? "#ff385c" : "rgba(0,0,0,.5)"} stroke="#fff" strokeWidth="2"><path d="M16 28c7-4.700 14-10 14-17 0-4.400-3.200-7-6.500-7-2.800 0-5.200 1.700-7.500 4.700C13.700 5.700 11.300 4 8.500 4 5.200 4 2 6.600 2 11c0 7 7 12.300 14 17Z" /></svg>
    </button>
  );
}
