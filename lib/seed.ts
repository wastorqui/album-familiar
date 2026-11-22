import type { State } from "./types";

// Datos iniciales: se cargan solo la primera vez. Todo se puede cambiar desde Ajustes.
export function seedState(): State {
  return {
    settings: {
      title: "Los días de Manolo, Cas y Margarita",
      subtitle: "Frases, primeras veces y momentos que no queremos olvidar",
      dedicationTo: "Para Casilda",
      dedication:
        "Para que no se nos escape nada: sus frases, sus primeras veces y esos días normales que algún día echaremos de menos. Yo lo empiezo; ahora es de los dos.",
      dedicationFrom: "Con todo mi cariño, Willy",
      parents: ["Papá", "Mamá"],
    },
    kids: {
      k1: { id: "k1", name: "Manolo", emoji: "🦁", color: "melocoton", active: true, order: 0 },
      k2: { id: "k2", name: "Cas", emoji: "🩰", color: "rosa", active: true, order: 1 },
      k3: { id: "k3", name: "Margarita", emoji: "🌼", color: "menta", active: true, order: 2 },
    },
    memories: {},
  };
}
