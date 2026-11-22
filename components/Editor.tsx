"use client";
import { useRef, useState } from "react";
import type { Kind, Memory, Photo, State } from "@/lib/types";
import { KINDS } from "@/lib/types";
import { sortedKids } from "@/lib/logic";
import { compress } from "@/lib/image";
import { today } from "@/lib/format";
import { Sheet } from "./ui";
import { photoUrl } from "@/lib/photoUrl";

type Upload = { key: string; preview: string; photo?: Photo; error?: boolean };

export default function Editor({
  memory, isNew, state, onClose, onSave, onDelete, flash,
}: { memory: Memory; isNew: boolean; state: State; onClose: () => void; onSave: (m: Memory) => Promise<boolean>; onDelete: (m: Memory) => void; flash: (m: string) => void }) {
  const [m, setM] = useState<Memory>(memory);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [saving, setSaving] = useState(false);
  const uploaded = useRef<Photo[]>([]); // fotos nuevas subidas en esta edición
  const kids = sortedKids(state);
  const set = (patch: Partial<Memory>) => setM((cur) => ({ ...cur, ...patch }));
  const busy = uploads.some((u) => !u.photo && !u.error);
  const kind = KINDS[m.kind];
  const total = m.photos.length + uploads.filter((u) => !u.error).length;

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).slice(0, Math.max(0, 12 - total));
    if (files.length > list.length) flash("Máximo 12 fotos por recuerdo");
    for (const f of list) {
      const key = Math.random().toString(36).slice(2);
      setUploads((u) => [...u, { key, preview: URL.createObjectURL(f) }]);
      (async () => {
        try {
          const c = await compress(f);
          const fd = new FormData();
          fd.append("full", c.full, "foto.jpg");
          fd.append("thumb", c.thumb, "mini.jpg");
          fd.append("w", String(c.w));
          fd.append("h", String(c.h));
          const r = await fetch("/api/upload", { method: "POST", body: fd });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error);
          uploaded.current.push(j);
          setUploads((u) => u.map((x) => (x.key === key ? { ...x, photo: j } : x)));
        } catch (e: any) {
          flash(e?.message || "No se ha podido subir una foto");
          setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: true } : x)));
        }
      })();
    }
  }

  async function discardNew(keep: Photo[] = []) {
    const keepSet = new Set(keep.map((p) => p.path));
    const orphan = uploaded.current.filter((p) => !keepSet.has(p.path));
    if (orphan.length) fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: orphan }) }).catch(() => {});
  }

  const close = () => { discardNew(); onClose(); };

  async function save() {
    const photos = [...m.photos, ...uploads.filter((u) => u.photo).map((u) => u.photo!)];
    if (!m.title.trim() && !m.text.trim() && photos.length === 0) { flash("Escribe algo o añade una foto"); return; }
    setSaving(true);
    const ok = await onSave({ ...m, photos });
    setSaving(false);
    if (ok) { discardNew(photos); onClose(); }
  }

  return (
    <Sheet open onClose={() => !busy && close()} title={isNew ? "Nuevo recuerdo" : "Editar recuerdo"}>
      <div className="field">
        <label>¿De quién?</label>
        <div className="kid-pick">
          {kids.map((k) => {
            const on = m.kidIds.includes(k.id);
            return (
              <button type="button" key={k.id} className={`c-${k.color} ${on ? "on" : ""}`} onClick={() => set({ kidIds: on ? m.kidIds.filter((x) => x !== k.id) : [...m.kidIds, k.id] })}>
                <span className="av">{k.emoji}</span>{k.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label>Tipo</label>
        <div className="kind-pick">
          {(Object.keys(KINDS) as Kind[]).map((key) => (
            <button type="button" key={key} className={m.kind === key ? "on" : ""} onClick={() => set({ kind: key })}>
              <span>{KINDS[key].emoji}</span>{KINDS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>{kind.titleLabel}</label>
        {m.kind === "frase" ? (
          <textarea className="input serif" style={{ fontSize: 18, minHeight: 80 }} value={m.title} onChange={(e) => set({ title: e.target.value })} placeholder={kind.placeholder} />
        ) : (
          <input className="input" value={m.title} onChange={(e) => set({ title: e.target.value })} placeholder={kind.placeholder} />
        )}
      </div>

      <div className="field">
        <label>{m.kind === "frase" ? "Contexto (opcional)" : "Cuéntalo (opcional)"}</label>
        <textarea className="input" value={m.text} onChange={(e) => set({ text: e.target.value })} placeholder={m.kind === "frase" ? "Lo dijo en el coche, volviendo del cole…" : "Qué pasó, quién estaba, cómo reaccionó…"} />
      </div>

      <div className="field">
        <label>Fotos</label>
        <div className="photo-grid">
          {m.photos.map((p) => (
            <div className="photo-tile" key={p.path}>
              <img src={photoUrl(p)} alt="" />
              <button className="x" onClick={() => set({ photos: m.photos.filter((x) => x.path !== p.path) })} aria-label="Quitar foto">✕</button>
            </div>
          ))}
          {uploads.filter((u) => !u.error).map((u) => (
            <div className={`photo-tile ${u.photo ? "" : "busy"}`} key={u.key}>
              <img src={u.preview} alt="" />
              {u.photo && <button className="x" onClick={() => setUploads((all) => all.filter((x) => x.key !== u.key))} aria-label="Quitar foto">✕</button>}
            </div>
          ))}
          {total < 12 && (
            <label className="add-photo">
              <span>📷</span>Añadir
              <input type="file" accept="image/*" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </div>

      <div className="field">
        <label>Fecha</label>
        <input className="input" type="date" value={m.date} max={today()} onChange={(e) => e.target.value && set({ date: e.target.value })} />
      </div>

      <div className="foot">
        <button className="btn ghost" onClick={close} disabled={busy}>Cancelar</button>
        <button className="btn primary" onClick={save} disabled={busy || saving}>{busy ? "Subiendo fotos…" : saving ? "Guardando…" : "Guardar"}</button>
      </div>
      {!isNew && <div style={{ marginTop: 6 }}><button className="btn danger big" onClick={() => onDelete(memory)}>Borrar recuerdo</button></div>}
    </Sheet>
  );
}
