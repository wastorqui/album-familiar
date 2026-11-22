export type Kid = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  birthDate?: string;
  active: boolean;
  order: number;
};

export type Photo = {
  path: string; // ruta de la foto grande
  thumb: string; // ruta de la miniatura
  w: number;
  h: number;
  access: "private" | "public" | "local";
};

export type Kind = "frase" | "logro" | "primera" | "momento";

export type Memory = {
  id: string;
  kidIds: string[];
  date: string; // AAAA-MM-DD
  kind: Kind;
  title: string; // la frase, o un titular corto
  text: string; // contexto o relato
  photos: Photo[];
  fav: boolean;
  by?: string;
  at: string;
};

export type Settings = {
  title: string;
  subtitle: string;
  dedicationTo: string;
  dedication: string;
  dedicationFrom: string;
  parents: string[];
};

export type State = {
  settings: Settings;
  kids: Record<string, Kid>;
  memories: Record<string, Memory>;
};

export type Collection = "kids" | "memories";
export const COLLECTIONS: Collection[] = ["kids", "memories"];

export type Action =
  | { type: "saveMemory"; item: Memory }
  | { type: "deleteMemory"; id: string }
  | { type: "toggleFav"; id: string }
  | { type: "saveKid"; item: Kid }
  | { type: "deleteKid"; id: string }
  | { type: "moveKid"; id: string; dir: -1 | 1 }
  | { type: "settings"; settings: Settings };

export const KINDS: Record<Kind, { emoji: string; label: string; titleLabel: string; placeholder: string }> = {
  frase: { emoji: "💬", label: "Frase", titleLabel: "¿Qué dijo?", placeholder: "Papá, cuando yo sea mayor tú serás pequeño" },
  primera: { emoji: "✨", label: "Primera vez", titleLabel: "¿Qué hizo por primera vez?", placeholder: "Primera vez que montó en bici sin ruedines" },
  logro: { emoji: "🏆", label: "Logro", titleLabel: "¿Qué ha conseguido?", placeholder: "Cinturón amarillo de judo" },
  momento: { emoji: "📸", label: "Momento", titleLabel: "Título del recuerdo", placeholder: "Tarde de playa en Llanes" },
};
