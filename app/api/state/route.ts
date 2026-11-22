import { NextResponse } from "next/server";
import { loadState } from "@/lib/store";
import { checkPhotoStorage } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await loadState();
    checkPhotoStorage();
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
