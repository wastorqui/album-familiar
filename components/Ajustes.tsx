"use client";
import { useEffect, useState } from "react";
import type { Action, Kid, Settings, State } from "@/lib/types";
import { sortedKids } from "@/lib/logic";
import { ageAt, today } from "@/lib/format";
import { type ConfirmState, EmojiField, KID_COLORS, Sheet, Switch } from "./ui";

export default function Ajustes({
  state, dispatch, setConfirm, flash, onWho, who, onDedication,
}: { state: State; dispatch: (a: Action) => Promise<boolean>; setConfirm: (c: ConfirmState) => void; flash: (m: string) => void; onWho: () => void; who: string; onDedication: () => void }) {
  const [kid, setKid] = useState<Kid | null>(null);
  const [texts, setTexts] = useState(false);
  const kids = sortedKids(state, true);
  const n = Object.keys(state.memories).length;

  return (
    <>
      <div className="section-title" style={{ marginTop: 8 }}>Ajustes</div>

      <div className="settings-group">
        <h3>Niños<button className="btn small" onClick={() => setKid({ id: `k${Date.now().toString(36)}`, name: "", emoji: "⭐", color: KID_COLORS[kids.length % KID_COLORS.length], active: true, order: 0 })}>＋ Añadir</button></h3>
        <div className="list">
          {kids.map((k, i) => {
            const a = ageAt(k.birthDate, today());
            const count = Object.values(state.memories).filter((m) => m.kidIds.includes(k.id)).length;
            return (
              <div key={k.id} className={`row-item ${k.active ? "" : "off"}`}>
                <span className="e">{k.emoji}</span>
                <button className="grow" style={{ background: "none", border: "none", textAlign: "left", padding: 0 }} onClick={() => setKid({ ...k })}>
                  <div className="t">{k.name}{k.active ? "" : " (oculto)"}</div>
                  <div className="s">{a ? `${a} · ` : ""}{count} {count === 1 ? "recuerdo" : "recuerdos"}</div>
                </button>
                <div className="order-btns">
                  <button disabled={i === 0} onClick={() => dispatch({ type: "moveKid", id: k.id, dir: -1 })} aria-label="Subir">▲</button>
                  <button disabled={i === kids.length - 1} onClick={() => dispatch({ type: "moveKid", id: k.id, dir: 1 })} aria-label="Bajar">▼</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="settings-group">
        <h3>Álbum</h3>
        <div className="list">
          <button className="row-item" onClick={() => setTexts(true)}>
            <span className="e">✍️</span>
            <div className="grow"><div className="t">Título, dedicatoria y adultos</div><div className="s">{state.settings.parents.join(", ")}</div></div>
            <span className="muted">›</span>
          </button>
          <button className="row-item" onClick={onDedication}>
            <span className="e">🎁</span>
            <div className="grow"><div className="t">Ver la dedicatoria</div></div>
            <span className="muted">›</span>
          </button>
          <button className="row-item" onClick={onWho}>
            <span className="e">🙋</span>
            <div className="grow"><div className="t">En este móvil soy…</div><div className="s">{who || "Sin elegir"}</div></div>
            <span className="muted">›</span>
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn big ghost" onClick={async () => { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }}>Cerrar sesión</button>
      </div>
      <p className="muted" style={{ textAlign: "center", fontSize: 13, marginTop: 14 }}>{n} recuerdos guardados. Los cambios los ve al momento quien use el álbum.</p>

      <KidEditor kid={kid} isNew={!!kid && !state.kids[kid.id]} onClose={() => setKid(null)} dispatch={dispatch} flash={flash} setConfirm={setConfirm} hasMemories={!!kid && Object.values(state.memories).some((m) => m.kidIds.includes(kid.id))} />
      <TextsEditor open={texts} settings={state.settings} onClose={() => setTexts(false)} dispatch={dispatch} />
    </>
  );
}

function KidEditor({ kid, isNew, onClose, dispatch, flash, setConfirm, hasMemories }: { kid: Kid | null; isNew: boolean; onClose: () => void; dispatch: (a: Action) => Promise<boolean>; flash: (m: string) => void; setConfirm: (c: ConfirmState) => void; hasMemories: boolean }) {
  const [k, setK] = useState<Kid | null>(kid);
  useEffect(() => setK(kid), [kid]);
  if (!k) return null;
  const set = (patch: Partial<Kid>) => setK({ ...k, ...patch });
  return (
    <Sheet open onClose={onClose} title={isNew ? "Nuevo niño" : `Editar ${k.name}`}>
      <div className="field"><label>Nombre</label><input className="input" value={k.name} onChange={(e) => set({ name: e.target.value })} /></div>
      <EmojiField value={k.emoji} onChange={(emoji) => set({ emoji })} options={["🦁", "🩰", "🌼", "🦄", "🐼", "🚀", "⚽", "🦋"]} />
      <div className="field">
        <label>Color</label>
        <div className="emoji-row">{KID_COLORS.map((c) => <button type="button" key={c} className={`color-opt c-${c} ${k.color === c ? "on" : ""}`} onClick={() => set({ color: c })} aria-label={c} />)}</div>
      </div>
      <div className="field"><label>Fecha de nacimiento (para ver la edad en cada recuerdo)</label><input className="input" type="date" value={k.birthDate || ""} onChange={(e) => set({ birthDate: e.target.value || undefined })} /></div>
      <div className="toggle-row"><span>{k.active ? "Visible" : "Oculto"}</span><Switch on={k.active} onChange={(active) => set({ active })} /></div>
      <div className="foot">
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={async () => { if (!k.name.trim()) { flash("Ponle un nombre"); return; } if (await dispatch({ type: "saveKid", item: k })) onClose(); }}>Guardar</button>
      </div>
      {!isNew && (
        <div style={{ marginTop: 6 }}>
          <button className="btn danger big" onClick={() => hasMemories ? flash("Tiene recuerdos: mejor ocúltalo") : setConfirm({ title: `¿Borrar a ${k.name}?`, ok: "Borrar", danger: true, onOk: async () => { if (await dispatch({ type: "deleteKid", id: k.id })) onClose(); } })}>Borrar</button>
        </div>
      )}
    </Sheet>
  );
}

function TextsEditor({ open, settings, onClose, dispatch }: { open: boolean; settings: Settings; onClose: () => void; dispatch: (a: Action) => Promise<boolean> }) {
  const [s, setS] = useState(settings);
  useEffect(() => { if (open) setS(settings); }, [open, settings]);
  const f = (key: keyof Settings, label: string, area = false) => (
    <div className="field">
      <label>{label}</label>
      {area
        ? <textarea className="input" value={s[key] as string} onChange={(e) => setS({ ...s, [key]: e.target.value })} />
        : <input className="input" value={s[key] as string} onChange={(e) => setS({ ...s, [key]: e.target.value })} />}
    </div>
  );
  return (
    <Sheet open={open} onClose={onClose} title="Textos del álbum">
      {f("title", "Título")}
      {f("subtitle", "Subtítulo")}
      {f("dedicationTo", "Dedicatoria: para…")}
      {f("dedication", "Dedicatoria: mensaje", true)}
      {f("dedicationFrom", "Dedicatoria: firma")}
      <div className="field">
        <label>Adultos que lo usan</label>
        <div className="stack" style={{ gap: 8 }}>
          {s.parents.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input className="input" value={p} onChange={(e) => setS({ ...s, parents: s.parents.map((x, j) => (j === i ? e.target.value : x)) })} />
              {s.parents.length > 1 && <button className="icon-btn" style={{ height: 48 }} onClick={() => setS({ ...s, parents: s.parents.filter((_, j) => j !== i) })}>✕</button>}
            </div>
          ))}
          <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => setS({ ...s, parents: [...s.parents, ""] })}>＋ Añadir adulto</button>
        </div>
      </div>
      <div className="foot">
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={async () => { if (await dispatch({ type: "settings", settings: { ...s, parents: s.parents.map((p) => p.trim()).filter(Boolean) } })) onClose(); }}>Guardar</button>
      </div>
    </Sheet>
  );
}
