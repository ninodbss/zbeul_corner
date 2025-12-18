import { NextResponse } from "next/server";
import crypto from "crypto";
import { getOpenIdFromSession } from "../../../../lib/session";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function genCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid confusing chars
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function POST(req: Request) {
  const openId = getOpenIdFromSession();
  if (!openId) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const sb = supabaseAdmin();
  const code = genCode();
  const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 min

  await sb.from("link_codes").insert({
    code,
    open_id: openId,
    expires_at: expires.toISOString()
  });

  return NextResponse.json({ code, expires_at: expires.toISOString() });
}
