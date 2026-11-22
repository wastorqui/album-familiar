import { del, get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { Photo } from "./types";

// Fotos: Vercel Blob (privado) en producción; carpeta data/uploads en pruebas locales.

const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), "data", "uploads");

export function checkPhotoStorage() {
  if (!hasBlob && process.env.VERCEL) throw new Error("Falta conectar el almacenamiento de fotos (Vercel Blob)");
}

async function putOne(name: string, data: Blob): Promise<{ path: string; access: Photo["access"] }> {
  if (!hasBlob) {
    await fs.mkdir(LOCAL, { recursive: true });
    await fs.writeFile(path.join(LOCAL, name), Buffer.from(await data.arrayBuffer()));
    return { path: name, access: "local" };
  }
  const opts = { contentType: "image/jpeg", addRandomSuffix: false, cacheControlMaxAge: 31536000 } as const;
  try {
    const r = await put(`fotos/${name}`, data, { ...opts, access: "private" });
    return { path: r.pathname, access: "private" };
  } catch (e) {
    // Si el almacén se creó como público, se guarda en público (rutas aleatorias, no adivinables)
    const r = await put(`fotos/${name}`, data, { ...opts, access: "public" });
    return { path: r.pathname, access: "public" };
  }
}

export async function savePhoto(full: Blob, thumb: Blob, w: number, h: number): Promise<Photo> {
  checkPhotoStorage();
  const id = `${Date.now().toString(36)}-${crypto.randomUUID()}`;
  const a = await putOne(`${id}.jpg`, full);
  const b = await putOne(`${id}-mini.jpg`, thumb);
  return { path: a.path, thumb: b.path, w, h, access: a.access };
}

export async function deletePhotos(paths: { path: string; access: Photo["access"] }[]) {
  if (!paths.length) return;
  if (!hasBlob) {
    await Promise.all(paths.map((p) => fs.rm(path.join(LOCAL, path.basename(p.path)), { force: true })));
    return;
  }
  await del(paths.map((p) => p.path)).catch((e) => console.error("No se pudieron borrar fotos", e));
}

export async function readPhoto(p: string, access: Photo["access"]): Promise<Response> {
  const headers = { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable" };
  if (access === "local" || !hasBlob) {
    try {
      const buf = await fs.readFile(path.join(LOCAL, path.basename(p)));
      return new Response(new Uint8Array(buf), { headers });
    } catch {
      return new Response("No encontrada", { status: 404 });
    }
  }
  const r = await get(p, { access });
  if (!r || r.statusCode !== 200) return new Response("No encontrada", { status: 404 });
  return new Response(r.stream, { headers });
}
