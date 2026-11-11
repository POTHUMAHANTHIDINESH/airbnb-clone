"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ListingDetail } from "@/lib/types";
import RequireAuth from "@/components/RequireAuth";
import ListingForm from "@/components/ListingForm";

function Edit() {
  const { id } = useParams<{ id: string }>(); const [l, setL] = useState<ListingDetail | null>(null); const [err, setErr] = useState("");
  useEffect(() => { api<ListingDetail>(`/api/host/listings/${id}`).then(setL).catch((e) => setErr(e.message)); }, [id]);
  if (err) return <div className="container empty"><h2>{err}</h2></div>;
  return l ? <ListingForm initial={l} /> : <div className="container"><div className="skel line" /></div>;
}
export default function Page() { return <RequireAuth host><Edit /></RequireAuth>; }
