"use client";
import { useState } from "react";

export default function Login() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
    if (r.ok) { window.location.href = "/"; return; }
    const j = await r.json().catch(() => ({}));
    setError(j.error || "No se ha podido entrar");
    setPin("");
    setBusy(false);
  }

  return (
    <main className="login">
      <form onSubmit={submit} className="login-card">
        <div className="login-logo">📔</div>
        <h1>Nuestro álbum</h1>
        <p className="muted">Escribe el PIN</p>
        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="••••••"
        />
        {error && <p className="error">{error}</p>}
        <button className="btn primary big" disabled={busy || pin.length < 4}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}
