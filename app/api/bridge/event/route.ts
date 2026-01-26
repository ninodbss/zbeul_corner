export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function parseAnyBody(req: Request) {
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    return await req.json().catch(() => ({}));
  }

  const text = await req.text();

  if (ct.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(text));
  }

  // fallback debug
  return { raw: text };
}

export async function POST(req: Request) {
  const url = new URL(req.url);

  // ✅ auth via query param (TikFinity can't send custom headers)
  const k = url.searchParams.get("k");
  if (!k || k !== process.env.BRIDGE_API_KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await parseAnyBody(req);

  // ✅ TikFinity envoie souvent ces clés (selon l’event)
  const command = String(body.comment || body.text || body.message || "").trim();
  const provider_user_id = String(body.userId || body.user_id || body.userid || "");
  const username = String(body.username || body.uniqueId || body.unique_id || "").replace(/^@+/, "");
  const nickname = String(body.nickname || body.displayName || body.display_name || "");
  const avatar_url = String(body.avatar_url || body.profilePictureUrl || body.profile_picture_url || "");

  // si c’est un webhook “commande”
  const event_type = command.startsWith("!reclaim") ? "reclaim" : "chat";

  const sb = supabaseAdmin();

  const { error } = await (sb as any).from("tikfinity_events").insert({
    provider: "tikfinity",
    provider_user_id: provider_user_id || null,
    username: username || null,
    nickname: nickname || null,
    avatar_url: avatar_url || null,
    event_type,
    message: command || null, // si t’as cette colonne, sinon enlève-la
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, received: { event_type, username, provider_user_id } });
}