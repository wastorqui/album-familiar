import { NextResponse, type NextRequest } from "next/server";
import { deletePhotos, savePhoto } from "@/lib/photos";
import { loadState } from "@/lib/store";
import { allPhotoPaths } from "@/lib/logic";
import type { Photo } from "@/lib/types";

export const dynamic = "force-dynamic";
const MAX = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const full = form.get("full"), thumb = form.get("thumb");
    if (!(full instanceof Blob) || !(thumb instanceof Blob)) return NextResponse.json({ error: "Falta la foto" }, { status: 400 });
    if (full.size > MAX || thumb.size > MAX) return NextResponse.json({ error: "Foto demasiado grande" }, { status: 400 });
    const photo = await savePhoto(full, thumb, Number(form.get("w")) || 0, Number(form.get("h")) || 0);
    return NextResponse.json(photo);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "No se ha podido subir la foto" }, { status: 500 });
  }
}

// Borra fotos subidas en un recuerdo que al final no se guardó
export async function DELETE(req: NextRequest) {
  const { photos } = (await req.json()) as { photos: Photo[] };
  const used = allPhotoPaths(await loadState());
  const orphan = (photos || []).filter((p) => !used.has(p.path) && /^(fotos\/)?[\w-]+\.jpg$/.test(p.path));
  await deletePhotos(orphan.flatMap((p) => [{ path: p.path, access: p.access }, { path: p.thumb, access: p.access }]));
  return NextResponse.json({ ok: true });
}
