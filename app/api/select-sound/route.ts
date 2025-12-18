import { NextResponse } from "next/server";
import { getOpenIdFromSession } from "../../../lib/session";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  const openId = getOpenIdFromSession();
  if (!openId) return NextResponse.redirect(new URL("/?err=login", req.url));

  const form = await req.formData();
  const soundId = String(form.get("sound_id") ?? "").trim();
  if (!soundId) return NextResponse.redirect(new URL("/sounds?err=missing_sound", req.url));

  const sb = supabaseAdmin();
  await sb.from("user_sounds").upsert(
    { open_id: openId, sound_id: soundId, updated_at: new Date().toISOString() },
    { onConflict: "open_id" }
  );

  return NextResponse.redirect(new URL("/me", req.url));
}
