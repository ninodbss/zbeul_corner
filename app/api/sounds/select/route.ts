export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const open_id = await getOpenIdFromSession();
    if (!open_id) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sound_id = String(body?.sound_id ?? "").trim();
    if (!sound_id) {
      return NextResponse.json({ error: "missing_sound_id" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    const { error } = await (sb as any)
      .from("user_sounds")
      .upsert(
        { open_id, sound_id, updated_at: new Date().toISOString() },
        { onConflict: "open_id" }
      );

    if (error) {
      return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, open_id, sound_id });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: String(e?.message ?? e) }, { status: 500 });
  }
}