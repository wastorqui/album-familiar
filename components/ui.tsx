"use client";
import { useEffect } from "react";

export const KID_COLORS = ["melocoton", "lila", "menta", "cielo", "rosa", "limon"];

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="grip" />
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" className={`switch ${on ? "on" : ""}`} onClick={() => onChange(!on)} aria-pressed={on} />;
}

export function EmojiField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="field">
      <label>Icono</label>
      <div className="emoji-row">
        {options.map((e) => (
          <button type="button" key={e} className={`emoji-opt ${value === e ? "on" : ""}`} onClick={() => onChange(e)}>{e}</button>
        ))}
        <input
          className="input"
          style={{ width: 70, textAlign: "center", fontSize: 22, padding: 6 }}
          value={value}
          onChange={(e) => onChange(Array.from(e.target.value).slice(-2).join(""))}
          aria-label="Otro icono"
        />
      </div>
    </div>
  );
}

export type ConfirmState = { title: string; text?: string; ok: string; danger?: boolean; onOk: () => void } | null;

export function Confirm({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  return (
    <Sheet open={!!state} onClose={onClose} title={state?.title}>
      {state?.text && <p className="muted" style={{ marginTop: -6, fontWeight: 600 }}>{state.text}</p>}
      <div className="foot">
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className={`btn ${state?.danger ? "danger" : "primary"}`} onClick={() => { state?.onOk(); onClose(); }}>{state?.ok}</button>
      </div>
    </Sheet>
  );
}
