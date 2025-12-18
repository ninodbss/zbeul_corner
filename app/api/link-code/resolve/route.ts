import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  const apiKey = process.env.BRIDGE_API_KEY;
  const got = new URL(req.url).searchParams.get("key");
  if (apiKey && got !== apiKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

  const sb = supabaseAdmin();
  const now = new Date().toISOString();

  const { data } = await sb
    .from("link_codes")
    .select("open_id,expires_at,used_at")
    .eq("code", code)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (data.used_at) return NextResponse.json({ error: "already_used" }, { status: 409 });
  if (data.expires_at < now) return NextResponse.json({ error: "expired" }, { status: 410 });

  // mark used
  await sb.from("link_codes").update({ used_at: now }).eq("code", code);

  return NextResponse.json({ open_id: data.open_id });
}
