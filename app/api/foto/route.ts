import { type NextRequest } from "next/server";
import { readPhoto } from "@/lib/photos";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const p = sp.get("p") || "";
  if (!/^(fotos\/)?[\w-]+\.jpg$/.test(p)) return new Response("No válida", { status: 400 });
  const a = sp.get("a");
  const access = a === "public" ? "public" : a === "local" ? "local" : "private";
  return readPhoto(p, access);
}
