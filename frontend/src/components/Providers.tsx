"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import AuthModal from "./AuthModal";

interface Auth {
  user: User | null; ready: boolean; login: (e: string, p: string) => Promise<void>;
  register: (n: string, e: string, p: string) => Promise<void>; logout: () => void;
  becomeHost: () => Promise<void>; requireAuth: (then?: () => void) => boolean; openAuth: () => void;
}
const AuthCtx = createContext<Auth>(null as any);
const ToastCtx = createContext<(msg: string, kind?: "ok" | "err") => void>(() => {});
export const useAuth = () => useContext(AuthCtx);
export const useToast = () => useContext(ToastCtx);

export default function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);

  const toast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) return setReady(true);
    api<User>("/api/auth/me").then(setUser).catch(() => localStorage.removeItem("token")).finally(() => setReady(true));
  }, []);

  const finish = (r: { token: string; user: User }) => { localStorage.setItem("token", r.token); setUser(r.user); setAuthOpen(false); };
  const auth: Auth = {
    user, ready,
    login: async (email, password) => { finish(await api("/api/auth/login", { body: { email, password } })); toast("Welcome back!"); },
    register: async (name, email, password) => { finish(await api("/api/auth/register", { body: { name, email, password } })); toast("Account created"); },
    logout: () => { localStorage.removeItem("token"); setUser(null); toast("Logged out"); },
    becomeHost: async () => { setUser(await api("/api/auth/become-host", { method: "POST" })); toast("You're now a host"); },
    requireAuth: (then) => { if (user) { then?.(); return true; } setAuthOpen(true); return false; },
    openAuth: () => setAuthOpen(true),
  };

  return (
    <AuthCtx.Provider value={auth}>
      <ToastCtx.Provider value={toast}>
        {children}
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>)}
        </div>
      </ToastCtx.Provider>
    </AuthCtx.Provider>
  );
}
