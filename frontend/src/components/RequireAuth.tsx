"use client";
import { ReactNode, useEffect } from "react";
import { useAuth } from "./Providers";

/** Gate for pages that need login (and optionally host mode). */
export default function RequireAuth({ children, host = false }: { children: ReactNode; host?: boolean }) {
  const { user, ready, openAuth, becomeHost } = useAuth();
  useEffect(() => { if (ready && !user) openAuth(); }, [ready, user, openAuth]);
  if (!ready) return <div className="container"><div className="skel line" /></div>;
  if (!user) return <div className="container empty"><h2>Log in to continue</h2><button className="btn primary" onClick={openAuth}>Log in or sign up</button></div>;
  if (host && !user.is_host) return <div className="container empty"><h2>Start hosting on Airbnb</h2><p className="muted">Switch to hosting to list your place and manage bookings.</p><button className="btn primary" onClick={becomeHost}>Become a host</button></div>;
  return <>{children}</>;
}
