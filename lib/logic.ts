import type { Action, Kid, Memory, Photo, State } from "./types";

export class ActionError extends Error {}

export function sortedKids(s: State, all = false): Kid[] {
  return Object.values(s.kids).filter((k) => all || k.active).sort((a, b) => a.order - b.order);
}

export function sortedMemories(s: State): Memory[] {
  return Object.values(s.memories).sort((a, b) => (a.date === b.date ? b.at.localeCompare(a.at) : b.date.localeCompare(a.date)));
}

export function allPhotoPaths(s: State): Set<string> {
  const out = new Set<string>();
  for (const m of Object.values(s.memories)) for (const p of m.photos) { out.add(p.path); out.add(p.thumb); }
  return out;
}

export function photosOf(s: State): Photo[] {
  return Object.values(s.memories).flatMap((m) => m.photos);
}

export function applyAction(prev: State, a: Action, by: string | undefined, now = new Date()): State {
  const s: State = { settings: prev.settings, kids: { ...prev.kids }, memories: { ...prev.memories } };
  switch (a.type) {
    case "saveMemory": {
      const m = a.item;
      if (!m.title.trim() && !m.text.trim() && m.photos.length === 0) throw new ActionError("Escribe algo o añade una foto");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date)) throw new ActionError("Fecha no válida");
      const old = s.memories[m.id];
      s.memories[m.id] = {
        ...m,
        title: m.title.trim(),
        text: m.text.trim(),
        photos: m.photos.slice(0, 12),
        by: old?.by ?? by,
        at: old?.at ?? now.toISOString(),
        fav: !!m.fav,
      };
      break;
    }
    case "deleteMemory":
      delete s.memories[a.id];
      break;
    case "toggleFav": {
      const m = s.memories[a.id];
      if (m) s.memories[a.id] = { ...m, fav: !m.fav };
      break;
    }
    case "saveKid": {
      const old = s.kids[a.item.id];
      const order = old ? old.order : Math.max(-1, ...Object.values(s.kids).map((k) => k.order)) + 1;
      s.kids[a.item.id] = { ...a.item, name: a.item.name.trim(), order };
      break;
    }
    case "deleteKid":
      if (Object.values(s.memories).some((m) => m.kidIds.includes(a.id))) throw new ActionError("Tiene recuerdos: desactívalo en vez de borrarlo");
      delete s.kids[a.id];
      break;
    case "moveKid": {
      const list = sortedKids(s, true);
      const i = list.findIndex((k) => k.id === a.id), j = i + a.dir;
      if (i < 0 || j < 0 || j >= list.length) break;
      [list[i], list[j]] = [list[j], list[i]];
      list.forEach((k, idx) => { if (k.order !== idx) s.kids[k.id] = { ...k, order: idx }; });
      break;
    }
    case "settings":
      s.settings = a.settings;
      break;
  }
  return s;
}
