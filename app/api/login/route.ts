import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, WHO_COOKIE, pin, sessionToken } from "@/lib/auth";
import { clearFails, isLocked, registerFail } from "@/lib/store";

const YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (await isLocked(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Prueba dentro de 15 minutos." }, { status: 429 });
  }
  const { pin: given, who } = await req.json();
  if (String(given || "") !== pin()) {
    await registerFail(ip);
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }
  await clearFails(ip);
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE, await sessionToken(), { httpOnly: true, sameSite: "lax", secure, maxAge: YEAR, path: "/" });
  if (who) res.cookies.set(WHO_COOKIE, encodeURIComponent(String(who).slice(0, 30)), { sameSite: "lax", secure, maxAge: YEAR, path: "/" });
  return res;
}
