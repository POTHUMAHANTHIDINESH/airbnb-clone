"use client";
import RequireAuth from "@/components/RequireAuth";
import ListingForm from "@/components/ListingForm";
export default function Page() { return <RequireAuth host><ListingForm /></RequireAuth>; }
