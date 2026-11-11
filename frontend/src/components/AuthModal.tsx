"use client";
import { useState } from "react";
import Modal from "./Modal";
import { useAuth } from "./Providers";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(""); try { await fn(); } catch (e: any) { setErr(e.message); } setBusy(false); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); run(() => mode === "login" ? login(f.email, f.password) : register(f.name, f.email, f.password)); };

  return (
    <Modal title={mode === "login" ? "Log in or sign up" : "Create your account"} onClose={onClose}>
      <h3 style={{ margin: "0 0 16px", fontSize: 22 }}>Welcome to Airbnb</h3>
      <form onSubmit={submit} className="stack">
        {mode === "signup" && <label className="field"><span>Full name</span><input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>}
        <label className="field"><span>Email</span><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="field"><span>Password</span><input required type="password" minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Continue" : "Sign up"}</button>
      </form>
      <p className="muted center" style={{ margin: "14px 0" }}>
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>{mode === "login" ? "Create an account" : "Log in"}</button>
      </p>
      <div className="divider"><span>or try a demo account</span></div>
      <div className="stack" style={{ marginTop: 14 }}>
        <button className="btn outline block" onClick={() => run(() => login("guest@demo.com", "password123"))}>👤 Continue as demo guest</button>
        <button className="btn outline block" onClick={() => run(() => login("host@demo.com", "password123"))}>🏡 Continue as demo host</button>
      </div>
    </Modal>
  );
}
