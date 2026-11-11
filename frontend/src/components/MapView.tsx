"use client";
import { useEffect, useRef } from "react";

/** Lightweight Leaflet map (OpenStreetMap tiles) showing price pins. */
export default function MapView({ pins, height = 360 }: { pins: { lat: number; lng: number; label: string }[]; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!el.current || !pins.length) return;
      map = L.map(el.current, { scrollWheelZoom: false }).setView([pins[0].lat, pins[0].lng], pins.length === 1 ? 13 : 4);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 18 }).addTo(map);
      pins.forEach((p) => L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html: `<div class="pin">${p.label}</div>`, iconSize: [0, 0] }) }).addTo(map!));
      if (pins.length > 1) map.fitBounds(pins.map((p) => [p.lat, p.lng] as [number, number]), { padding: [30, 30] });
    })();
    return () => { map?.remove(); };
  }, [pins]);
  return <div ref={el} className="map" style={{ height }} />;
}
