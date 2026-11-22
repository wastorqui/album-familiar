import { NextResponse, type NextRequest } from "next/server";
import { ActionError, applyAction, photosOf } from "@/lib/logic";
import { loadState, saveDiff } from "@/lib/store";
import { deletePhotos } from "@/lib/photos";
import { WHO_COOKIE } from "@/lib/auth";
import type { Action } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const action = (await req.json()) as Action;
  const who = req.cookies.get(WHO_COOKIE)?.value;
  const by = who ? decodeURIComponent(who) : undefined;
  const prev = await loadState();
  try {
    const next = applyAction(prev, action, by);
    await saveDiff(prev, next);
    // Borra del almacén las fotos que ya no usa ningún recuerdo
    const still = new Set(photosOf(next).map((p) => p.path));
    const gone = photosOf(prev).filter((p) => !still.has(p.path));
    await deletePhotos(gone.flatMap((p) => [{ path: p.path, access: p.access }, { path: p.thumb, access: p.access }]));
    return NextResponse.json(next, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = e instanceof ActionError ? e.message : "No se ha podido guardar";
    if (!(e instanceof ActionError)) console.error(e);
    return NextResponse.json({ error: msg, state: prev }, { status: 400 });
  }
}
