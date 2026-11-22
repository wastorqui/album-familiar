"use client";
import { useMemo, useState } from "react";
import type { State } from "@/lib/types";
import { sortedKids, sortedMemories } from "@/lib/logic";
import { longDate } from "@/lib/format";
import { photoUrl } from "@/lib/photoUrl";

// Libro imprimible: se guarda como PDF desde el móvil u ordenador (Imprimir → Guardar como PDF).
export default function Book({ state }: { state: State }) {
  const kids = sortedKids(state, true);
  const all = sortedMemories(state);
  const years = Array.from(new Set(all.map((m) => m.date.slice(0, 4)))).sort().reverse();
  const [kid, setKid] = useState("");
  const [year, setYear] = useState(years[0] || "");
  const [onlyFav, setOnlyFav] = useState(false);
  const k = kid ? state.kids[kid] : null;

  const list = useMemo(
    () => all.filter((m) => (!year || m.date.startsWith(year)) && (!kid || m.kidIds.includes(kid)) && (!onlyFav || m.fav)).reverse(),
    [all, year, kid, onlyFav]
  );

  if (all.length === 0) return <p className="empty" style={{ marginTop: 30 }}>Cuando tengáis recuerdos, aquí podréis montar un libro por niño y año para guardarlo en PDF o imprimirlo. 📖</p>;

  return (
    <>
      <div className="no-print">
        <div className="section-title" style={{ marginTop: 8 }}>Libro</div>
        <div className="book-controls">
          <div className="book-row">
            <select value={kid} onChange={(e) => setKid(e.target.value)} aria-label="Niño">
              <option value="">Todos</option>
              {kids.map((x) => <option key={x.id} value={x.id}>{x.emoji} {x.name}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Año">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="book-row" style={{ marginBottom: 0 }}>
            <button className={`btn ${onlyFav ? "primary" : "ghost"}`} onClick={() => setOnlyFav(!onlyFav)}>♥ Solo favoritos</button>
            <button className="btn primary" onClick={() => window.print()} disabled={!list.length}>Guardar PDF</button>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "10px 4px 0", fontWeight: 600 }}>Al pulsar “Guardar PDF”, elige “Guardar como PDF” o compártelo para imprimirlo.</p>
      </div>

      <div className="book">
        <div className="book-cover">
          <div className="bc-emoji">{k ? k.emoji : "📔"}</div>
          <h1>{k ? `Los días de ${k.name}` : state.settings.title}</h1>
          <div className="bc-year">{year}</div>
          <div className="bc-ded">{state.settings.dedication}</div>
        </div>
        {list.map((m) => (
          <div className="book-entry" key={m.id}>
            <div className="book-date">{longDate(m.date)}{!kid && m.kidIds.length ? ` · ${m.kidIds.map((id) => state.kids[id]?.name).filter(Boolean).join(", ")}` : ""}</div>
            {m.title && (m.kind === "frase" ? <p className="mem-quote">{m.title}</p> : <p className="mem-title">{m.title}</p>)}
            {m.text && <p className="mem-text">{m.text}</p>}
            {m.photos.length > 0 && (
              <div className={`book-photos ${m.photos.length === 1 ? "one" : ""}`}>
                {m.photos.map((p) => <img key={p.path} src={photoUrl(p, true)} alt="" loading="lazy" />)}
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="empty">No hay recuerdos con estos filtros.</p>}
      </div>
    </>
  );
}
