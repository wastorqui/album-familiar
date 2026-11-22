export const nf = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 2 });
export const coins = (n: number) => `${nf(n)} ${Math.abs(n) === 1 ? "moneda" : "monedas"}`;
export const signed = (n: number) => (n > 0 ? `+${nf(n)}` : nf(n));

export const toISODate = (d: Date) => d.toLocaleDateString("sv-SE"); // AAAA-MM-DD en hora local
export const today = () => toISODate(new Date());
export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
export function prettyDate(iso: string, withYear = false) {
  const t = today();
  if (iso === t) return "Hoy";
  if (iso === addDays(t, -1)) return "Ayer";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });
}
export function age(birthDate?: string) {
  if (!birthDate) return null;
  const b = new Date(birthDate + "T12:00:00");
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a >= 0 ? a : null;
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function ageAt(birthDate: string | undefined, iso: string) {
  if (!birthDate) return null;
  const b = new Date(birthDate + "T12:00:00"), n = new Date(iso + "T12:00:00");
  let y = n.getFullYear() - b.getFullYear();
  let m = n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) m--;
  if (m < 0) { y--; m += 12; }
  if (y < 0) return null;
  if (y === 0) return m <= 1 ? (m === 1 ? "1 mes" : "recién nacido") : `${m} meses`;
  return y === 1 ? "1 año" : `${y} años`;
}
export const longDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
export const monthLabel = (iso: string) =>
  new Date(iso.slice(0, 7) + "-15T12:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
