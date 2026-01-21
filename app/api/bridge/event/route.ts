export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function authOk(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-api-key");
  return Boolean(key && key === process.env.BRIDGE_API_KEY);
}

/**
 * POST /api/bridge/event
 * Header: x-api-key: BRIDGE_API_KEY
 * Body: { type: "join"|"like"|"chat", userId, username?, nickname?, avatar_url? }
 *
 * Insère un event dans la table `tikfinity_events` (celle que tu as déjà sur Supabase).
 */
export async function POST(req: Request) {
  if (!authOk(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const event_type = String(body?.type || "").trim(); // join / like / chat
  const provider_user_id = String(body?.userId || "").trim();

  // (optionnels)
  const username = body?.username ? String(body.username).trim() : null;
  const nickname = body?.nickname ? String(body.nickname).trim() : null;
  const avatar_url = body?.avatar_url ? String(body.avatar_url).trim() : null;

  if (!event_type) return NextResponse.json({ error: "missing_type" }, { status: 400 });
  if (!provider_user_id) return NextResponse.json({ error: "missing_userId" }, { status: 400 });

  const sb = supabaseAdmin();

  // ✅ IMPORTANT : ta table s'appelle tikfinity_events (pas live_events)
  // Et côté link-live tu lis event_type + created_at, donc on écrit event_type
  const { error } = await (sb as any).from("tikfinity_events").insert({
    provider: "tikfinity",
    provider_user_id,
    username,
    nickname,
    avatar_url,
    event_type,
    // created_at: inutile si ta colonne est "created_at" avec DEFAULT now()
    // mais si tu veux forcer côté code:
    // created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: "insert_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}