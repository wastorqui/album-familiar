"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Action, Memory, Photo, State } from "@/lib/types";
import { KINDS } from "@/lib/types";
import { applyAction, sortedKids, sortedMemories } from "@/lib/logic";
import { ageAt, longDate, monthLabel, today } from "@/lib/format";
import { Confirm, type ConfirmState, Sheet } from "./ui";
import Editor from "./Editor";
import Book from "./Book";
import Ajustes from "./Ajustes";

type Tab = "inicio" | "recuerdos" | "libro" | "ajustes";
import { photoUrl } from "@/lib/photoUrl";

function readWho() {
  const m = document.cookie.match(/(?:^|; )album_quien=([^;]*)/);
  return m ? decodeURIComponent(decodeURIComponent(m[1])) : "";
}
function writeWho(name: string) {
  document.cookie = `album_quien=${encodeURIComponent(encodeURIComponent(name))}; path=/; max-age=31536000; samesite=lax`;
}
function seenWelcome() { try { return localStorage.getItem("album_bienvenida") === "1"; } catch { return false; } }
function markWelcome() { try { localStorage.setItem("album_bienvenida", "1"); } catch {} }

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<Tab>("inicio");
  const [who, setWho] = useState("");
  const [whoOpen, setWhoOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [viewer, setViewer] = useState<{ photos: Photo[]; i: number } | null>(null);
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const pending = useRef(0);
  const stateRef = useRef<State | null>(null);
  stateRef.current = state;

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? "" : t)), 2600);
  }, []);

  const load = useCallback(async () => {
    if (pending.current > 0) return;
    const r = await fetch("/api/state", { cache: "no-store" });
    if (r.status === 401) { window.location.href = "/login"; return; }
    if (r.ok) { if (pending.current === 0) setState(await r.json()); }
    else if (!stateRef.current) setLoadError((await r.json().catch(() => ({}))).error || "No se han podido cargar los datos");
  }, []);

  useEffect(() => {
    load();
    const w = readWho();
    setWho(w);
    if (!seenWelcome()) setWelcome(true);
    else if (!w) setWhoOpen(true);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    const t = window.setInterval(() => document.visibilityState === "visible" && load(), 30000);
    return () => { document.removeEventListener("visibilitychange", onVis); window.clearInterval(t); };
  }, [load]);

  const dispatch = useCallback(async (a: Action): Promise<boolean> => {
    const cur = stateRef.current;
    if (!cur) return false;
    try { setState(applyAction(cur, a, readWho())); } catch (e: any) { flash(e.message || "No se puede hacer"); return false; }
    pending.current++;
    try {
      const r = await fetch("/api/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
      if (r.status === 401) { window.location.href = "/login"; return false; }
      const j = await r.json();
      pending.current--;
      if (!r.ok) { flash(j.error || "No se ha podido guardar"); if (pending.current === 0 && j.state) setState(j.state); return false; }
      if (pending.current === 0) setState(j);
      return true;
    } catch {
      pending.current--;
      flash("Sin conexión: no se ha guardado");
      load();
      return false;
    }
  }, [flash, load]);

  if (!state) return <div className="loading">{loadError ? <p className="error" style={{ fontSize: 16, textAlign: "center", padding: 20 }}>{loadError}</p> : "📔"}</div>;

  const go = (t: Tab) => { setTab(t); window.scrollTo({ top: 0 }); };
  const newMemory = (): Memory => ({ id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, kidIds: [], date: today(), kind: "frase", title: "", text: "", photos: [], fav: false, at: "" });
  const cardProps = {
    state,
    onEdit: (m: Memory) => setEditing(m),
    onFav: (m: Memory) => dispatch({ type: "toggleFav", id: m.id }),
    onPhoto: (photos: Photo[], i: number) => setViewer({ photos, i }),
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><div className="brand-logo">📔</div>Nuestro álbum</div>
        <button className="who-chip" onClick={() => setWhoOpen(true)}>{who ? `Soy ${who}` : "¿Quién eres?"}</button>
      </header>

      {tab === "inicio" && <Inicio {...cardProps} onAdd={() => setEditing(newMemory())} onAll={() => go("recuerdos")} onDedication={() => setWelcome(true)} />}
      {tab === "recuerdos" && <Recuerdos {...cardProps} />}
      {tab === "libro" && <Book state={state} />}
      {tab === "ajustes" && <Ajustes state={state} dispatch={dispatch} setConfirm={setConfirm} flash={flash} onWho={() => setWhoOpen(true)} who={who} onDedication={() => setWelcome(true)} />}

      <nav className="tabbar no-print">
        <div className="tabbar-in">
          <button className={`tab ${tab === "inicio" ? "on" : ""}`} onClick={() => go("inicio")}><span className="ti">🏠</span>Inicio</button>
          <button className={`tab ${tab === "recuerdos" ? "on" : ""}`} onClick={() => go("recuerdos")}><span className="ti">🗂️</span>Recuerdos</button>
          <button className="tab add" onClick={() => setEditing(newMemory())} aria-label="Añadir recuerdo"><span className="ti">＋</span>Añadir</button>
          <button className={`tab ${tab === "libro" ? "on" : ""}`} onClick={() => go("libro")}><span className="ti">📖</span>Libro</button>
          <button className={`tab ${tab === "ajustes" ? "on" : ""}`} onClick={() => go("ajustes")}><span className="ti">⚙️</span>Ajustes</button>
        </div>
      </nav>

      {editing && (
        <Editor
          memory={editing}
          isNew={!state.memories[editing.id]}
          state={state}
          onClose={() => setEditing(null)}
          onSave={async (m) => { const ok = await dispatch({ type: "saveMemory", item: m }); if (ok) flash("Recuerdo guardado ✨"); return ok; }}
          onDelete={(m) => setConfirm({ title: "¿Borrar este recuerdo?", text: "Se borrarán también sus fotos. No se puede deshacer.", ok: "Borrar", danger: true, onOk: async () => { if (await dispatch({ type: "deleteMemory", id: m.id })) setEditing(null); } })}
          flash={flash}
        />
      )}

      {viewer && <Lightbox photos={viewer.photos} start={viewer.i} onClose={() => setViewer(null)} />}

      {welcome && (
        <div className="welcome" onClick={() => {}}>
          <div className="welcome-card">
            <div className="ribbon">🎁</div>
            <div className="to">{state.settings.dedicationTo}</div>
            <div className="msg">{state.settings.dedication}</div>
            <div className="from">{state.settings.dedicationFrom}</div>
            <button className="btn primary big" onClick={() => { markWelcome(); setWelcome(false); if (!readWho()) setWhoOpen(true); }}>Abrir el álbum</button>
          </div>
        </div>
      )}

      <Sheet open={whoOpen} onClose={() => who && setWhoOpen(false)} title="¿Quién eres?">
        <p className="muted" style={{ marginTop: -6, fontWeight: 600 }}>Así cada recuerdo dice quién lo apuntó.</p>
        <div className="stack">
          {state.settings.parents.map((p) => (
            <button key={p} className={`btn big ${p === who ? "primary" : "ghost"}`} onClick={() => { writeWho(p); setWho(p); setWhoOpen(false); }}>{p}</button>
          ))}
        </div>
      </Sheet>
      <Confirm state={confirm} onClose={() => setConfirm(null)} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

type CardProps = { state: State; onEdit: (m: Memory) => void; onFav: (m: Memory) => void; onPhoto: (p: Photo[], i: number) => void };

/* ---------------- Tarjeta ---------------- */
export function MemoryCard({ m, state, onEdit, onFav, onPhoto }: CardProps & { m: Memory }) {
  const k = KINDS[m.kind];
  const n = m.photos.length;
  const shown = m.photos.slice(0, n > 4 ? 4 : n);
  return (
    <article className="mem">
      {n > 0 && (
        <div className={`mem-photos n${Math.min(n, 4)}`}>
          {shown.map((p, i) => (
            <button key={p.path} onClick={() => onPhoto(m.photos, i)} aria-label="Ver foto">
              <img src={photoUrl(p, n === 1)} alt="" loading="lazy" />
              {i === 3 && n > 4 && <span className="more">+{n - 4}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="mem-body">
        <div className="mem-meta"><span className="kind">{k.emoji} {k.label}</span><span>{longDate(m.date)}</span></div>
        {m.kidIds.length > 0 && (
          <div className="mem-kids">
            {m.kidIds.map((id) => state.kids[id]).filter(Boolean).map((kid) => {
              const a = ageAt(kid.birthDate, m.date);
              return <span key={kid.id} className={`mem-kid c-${kid.color}`}><span className="av">{kid.emoji}</span>{kid.name}{a ? ` · ${a}` : ""}</span>;
            })}
          </div>
        )}
        {m.title && (m.kind === "frase" ? <p className="mem-quote">{m.title}</p> : <p className="mem-title">{m.title}</p>)}
        {m.text && <p className="mem-text">{m.text}</p>}
        <div className="mem-foot">
          <span>{m.by ? `Lo apuntó ${m.by}` : ""}</span>
          <span className="mem-actions">
            <button className={`icon-btn ${m.fav ? "fav" : ""}`} onClick={() => onFav(m)} aria-label="Favorito">{m.fav ? "♥" : "♡"}</button>
            <button className="icon-btn" onClick={() => onEdit(m)} aria-label="Editar">✎</button>
          </span>
        </div>
      </div>
    </article>
  );
}

/* ---------------- Inicio ---------------- */
function Inicio(p: CardProps & { onAdd: () => void; onAll: () => void; onDedication: () => void }) {
  const { state } = p;
  const kids = sortedKids(state);
  const all = sortedMemories(state);
  const nPhotos = all.reduce((s, m) => s + m.photos.length, 0);
  const t = today();
  const onThisDay = all.filter((m) => m.date.slice(5) === t.slice(5) && m.date.slice(0, 4) !== t.slice(0, 4));

  return (
    <>
      <section className="cover">
        <h1>{state.settings.title}</h1>
        <p>{state.settings.subtitle}</p>
        <div className="cover-kids">
          {kids.map((k) => <span key={k.id} className={`kid-pill c-${k.color}`}><span className="av">{k.emoji}</span>{k.name}</span>)}
        </div>
        <div className="cover-stats">
          {all.length} {all.length === 1 ? "recuerdo" : "recuerdos"} · {nPhotos} {nPhotos === 1 ? "foto" : "fotos"} · <button className="link" onClick={p.onDedication}>Dedicatoria</button>
        </div>
      </section>

      <div style={{ marginTop: 16 }}>
        <button className="btn primary big" onClick={p.onAdd}>＋ Añadir un recuerdo</button>
      </div>

      {onThisDay.length > 0 && (
        <>
          <div className="section-title">Tal día como hoy</div>
          <div className="stack">{onThisDay.map((m) => <MemoryCard key={m.id} m={m} {...p} />)}</div>
        </>
      )}

      <div className="section-title">
        <span>Lo último</span>
        {all.length > 5 && <button className="link" onClick={p.onAll}>Ver todos</button>}
      </div>
      {all.length === 0 ? (
        <p className="empty">Todavía no hay recuerdos.<br />Empieza por una frase que os haya hecho reír esta semana. 💬</p>
      ) : (
        <div className="stack">{all.slice(0, 5).map((m) => <MemoryCard key={m.id} m={m} {...p} />)}</div>
      )}
    </>
  );
}

/* ---------------- Recuerdos ---------------- */
function Recuerdos(p: CardProps) {
  const { state } = p;
  const [kid, setKid] = useState("");
  const [kind, setKind] = useState("");
  const [fav, setFav] = useState(false);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(30);
  const kids = sortedKids(state, true);
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return sortedMemories(state).filter((m) =>
      (!kid || m.kidIds.includes(kid)) && (!kind || m.kind === kind) && (!fav || m.fav) &&
      (!qq || `${m.title} ${m.text}`.toLowerCase().includes(qq)));
  }, [state, kid, kind, fav, q]);
  const shown = list.slice(0, limit);
  let lastMonth = "";

  return (
    <>
      <div className="section-title" style={{ marginTop: 8 }}>Recuerdos <span className="muted" style={{ fontSize: 14 }}>{list.length}</span></div>
      <div className="chips">
        <button className={`chip ${!kid ? "on" : ""}`} onClick={() => setKid("")}>Todos</button>
        {kids.map((k) => <button key={k.id} className={`chip ${kid === k.id ? "on" : ""}`} onClick={() => setKid(kid === k.id ? "" : k.id)}>{k.emoji} {k.name}</button>)}
      </div>
      <div className="chips" style={{ marginTop: 6 }}>
        <button className={`chip ${fav ? "on" : ""}`} onClick={() => setFav(!fav)}>♥ Favoritos</button>
        {Object.entries(KINDS).map(([key, v]) => <button key={key} className={`chip ${kind === key ? "on" : ""}`} onClick={() => setKind(kind === key ? "" : key)}>{v.emoji} {v.label}</button>)}
      </div>
      <input className="search" placeholder="Buscar una frase o un recuerdo…" value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.map((m) => {
        const mo = m.date.slice(0, 7);
        const head = mo !== lastMonth ? <div className="month">{monthLabel(m.date)}</div> : null;
        lastMonth = mo;
        return <div key={m.id}>{head}<MemoryCard m={m} {...p} /><div style={{ height: 14 }} /></div>;
      })}
      {list.length === 0 && <p className="empty">No hay recuerdos con estos filtros.</p>}
      {list.length > limit && <button className="btn big ghost" onClick={() => setLimit(limit + 30)}>Ver más</button>}
    </>
  );
}

/* ---------------- Visor ---------------- */
function Lightbox({ photos, start, onClose }: { photos: Photo[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const x0 = useRef<number | null>(null);
  const prev = () => setI((v) => (v - 1 + photos.length) % photos.length);
  const next = () => setI((v) => (v + 1) % photos.length);
  return (
    <div className="lightbox">
      <div className="lb-top"><span>{i + 1} / {photos.length}</span><button onClick={onClose}>Cerrar</button></div>
      <div
        className="lb-img"
        onTouchStart={(e) => (x0.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (x0.current === null) return;
          const dx = e.changedTouches[0].clientX - x0.current;
          if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
          x0.current = null;
        }}
      >
        <img src={photoUrl(photos[i], true)} alt="" />
      </div>
      {photos.length > 1 && <div className="lb-nav"><button onClick={prev}>‹ Anterior</button><button onClick={next}>Siguiente ›</button></div>}
    </div>
  );
}
