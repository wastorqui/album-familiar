// Sesión sencilla con PIN: la cookie guarda una firma del PIN, así que cambiar el PIN cierra todas las sesiones.
// Funciona tanto en el middleware (Edge) como en las rutas de servidor.

export const COOKIE = "album_sesion";
export const WHO_COOKIE = "album_quien";

function secret() {
  return process.env.SESSION_SECRET || "solo-para-pruebas-locales";
}
export function pin() {
  return process.env.APP_PIN || "1234";
}

export async function sessionToken(): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("album:" + pin()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const expected = await sessionToken();
  if (value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
