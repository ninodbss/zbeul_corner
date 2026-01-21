// app/api/sounds/select/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import sounds from "@/data/sounds.json";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";

type Sound = { id: string; title: string; artist?: string | null };

function isValidSoundId(soundId: string) {
  const list = sounds as unknown as Sound[];
  return list.some((s) => s.id === soundId);
}

async function readSoundId(req: Request): Promise<string> {
  const ct = req.headers.get("content-type") ?? "";

  // JSON
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return String(body?.sound_id ?? body?.soundId ?? "").trim();
  }

  // Form
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    if (!fd) return "";
    return String(fd.get("sound_id") ?? fd.get("soundId") ?? "").trim();
  }

  // fallback try JSON
  const body = await req.json().catch(() => ({}));
  return String(body?.sound_id ?? body?.soundId ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const open_id = await getOpenIdFromSession();
    if (!open_id) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const sound_id = await readSoundId(req);
    if (!sound_id) return NextResponse.json({ error: "missing_sound_id" }, { status: 400 });
    if (!isValidSoundId(sound_id)) return NextResponse.json({ error: "invalid_sound_id", sound_id }, { status: 400 });

    const sb = supabaseAdmin();
    const now = new Date().toISOString();

    const { error } = await (sb as any)
      .from("user_sounds")
      .upsert({ open_id, sound_id, updated_at: now }, { onConflict: "open_id" });

    if (error) {
      return NextResponse.json({ error: "db_error", details: String(error?.message ?? error) }, { status: 500 });
    }

    // Si ça vient d’un form (souvent), on redirect vers /me ou /sounds
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      return NextResponse.redirect(new URL("/me", req.url), { status: 303 });
    }

    return NextResponse.json({ ok: true, open_id, sound_id, updated_at: now, build: "SOUNDS_SELECT_V2_FORM_JSON" });
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", details: String(e?.message ?? e), build: "SOUNDS_SELECT_V2_FORM_JSON" },
      { status: 500 }
    );
  }
}