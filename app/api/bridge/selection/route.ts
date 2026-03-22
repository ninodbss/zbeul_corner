import { NextResponse } from "next/server";
import { getSoundById } from "../../../../lib/sounds";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  const apiKey = process.env.BRIDGE_API_KEY;
  const got = new URL(req.url).searchParams.get("key");
  if (apiKey && got !== apiKey) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const openId = new URL(req.url).searchParams.get("open_id");
  if (!openId) return NextResponse.json({ error: "missing_open_id" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data } = await sb.from("user_sounds").select("sound_id").eq("open_id", openId).maybeSingle();
  const soundId = data?.sound_id ?? null;

  const sound = soundId ? getSoundById(soundId) : null;

  return NextResponse.json({ open_id: openId, sound });
}
