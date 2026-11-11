"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "./SearchBar";
import Modal from "./Modal";
import { useAuth } from "./Providers";
import { fmt } from "@/lib/utils";

function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Airbnb home">
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3c-2 0-3 1.5-4 3.5L5 21c-1.5 3.3 0 6.5 3 7 2.2.3 4.2-.8 5.700-2.700L16 22.500l2.300 2.800c1.500 1.900 3.500 3 5.700 2.700 3-.5 4.500-3.700 3-7L20 6.500C19 4.500 18 3 16 3Z" />
        <circle cx="16" cy="17.500" r="3.200" />
      </svg><span>airbnb</span>
    </Link>
  );
}

function MobileSearch() {
  const sp = useSearchParams(); const [open, setOpen] = useState(false);
  const label = [sp.get("q") || "Anywhere", sp.get("check_in") ? fmt(sp.get("check_in")!) : "Any week", sp.get("guests") ? `${sp.get("guests")} guests` : "Add guests"].join("  •  ");
  return (
    <>
      <button className="mobile-search" onClick={() => setOpen(true)}>🔍 <span>{label}</span></button>
      {open && <Modal title="Search" onClose={() => setOpen(false)}><SearchBar stacked onDone={() => setOpen(false)} /></Modal>}
    </>
  );
}

export default function Header() {
  const { user, logout, openAuth, becomeHost } = useAuth();
  const [menu, setMenu] = useState(false); const [dark, setDark] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggleTheme = () => {
    const next = dark ? "light" : "dark"; document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next); setDark(!dark);
  };
  const Item = ({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) =>
    href ? <Link href={href} className="menu-item" onClick={() => setMenu(false)}>{children}</Link>
         : <button className="menu-item" onClick={() => { setMenu(false); onClick?.(); }}>{children}</button>;

  return (
    <header className="header">
      <div className="header-row">
        <Logo />
        <div className="search-desktop"><Suspense fallback={null}><SearchBar /></Suspense></div>
        <div className="header-right">
          {user?.is_host ? <Link href="/host" className="host-link">Switch to hosting</Link>
            : <button className="host-link" onClick={() => user ? becomeHost() : openAuth()}>Airbnb your home</button>}
          <div className="menu-wrap" ref={ref}>
            <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Account menu" aria-expanded={menu}>
              <span>☰</span>
              {user?.avatar ? <img src={user.avatar} alt="" className="avatar" /> : <span className="avatar ph">👤</span>}
            </button>
            {menu && (
              <div className="menu">
                {user ? <>
                  <div className="menu-user"><b>{user.name}</b><div className="muted small">{user.is_host ? "Host" : "Guest"}</div></div>
                  <Item href="/trips">Trips</Item><Item href="/wishlist">Wishlists</Item>
                  {user.is_host && <Item href="/host">Host dashboard</Item>}
                  {user.is_host && <Item href="/host/new">Create a listing</Item>}
                  {!user.is_host && <Item onClick={becomeHost}>Become a host</Item>}
                  <hr /><Item onClick={toggleTheme}>{dark ? "☀️ Light mode" : "🌙 Dark mode"}</Item>
                  <Item onClick={logout}>Log out</Item>
                </> : <>
                  <Item onClick={openAuth}><b>Log in</b></Item><Item onClick={openAuth}>Sign up</Item>
                  <hr /><Item onClick={toggleTheme}>{dark ? "☀️ Light mode" : "🌙 Dark mode"}</Item>
                </>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="search-mobile"><Suspense fallback={null}><MobileSearch /></Suspense></div>
    </header>
  );
}
