// app/api/live/claim/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function normUsername(u: string) {
  return String(u ?? "").trim().replace(/^@/, "").toLowerCase();
}

// TikFinity peut envoyer des keys différentes selon l’event → on accepte large
function pickProviderUserId(body: any) {
  return (
    body?.userId ??
    body?.user_id ??
    body?.provider_user_id ??
    body?.uniqueId ??
    body?.unique_id ??
    body?.data?.userId ??
    body?.data?.uniqueId ??
    null
  );
}

function pickUsername(body: any) {
  return (
    body?.username ??
    body?.uniqueId ??
    body?.unique_id ??
    body?.data?.username ??
    body?.data?.uniqueId ??
    ""
  );
}

function pickNickname(body: any) {
  return body?.nickname ?? body?.displayName ?? body?.data?.nickname ?? body?.data?.displayName ?? null;
}

function pickAvatarUrl(body: any) {
  return body?.avatar_url ?? body?.profilePictureUrl ?? body?.data?.avatar_url ?? body?.data?.profilePictureUrl ?? null;
}

export async function POST(req: Request) {
  // Sécurité : vérifie une clé webhook (met la même dans TikFinity)
  const key = req.headers.get("x-api-key");
  if (!process.env.BRIDGE_API_KEY || key !== process.env.BRIDGE_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad_json" }, { status: 400 });

  const provider_user_id = String(pickProviderUserId(body) ?? "");
  const username = normUsername(pickUsername(body));
  const nickname = pickNickname(body);
  const avatar_url = pickAvatarUrl(body);

  if (!provider_user_id || !username) {
    return NextResponse.json({ error: "missing_fields", provider_user_id, username }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // 1) trouve une demande de reclaim récente pour ce username
  const nowIso = new Date().toISOString();
  const { data: reqRow, error: reqErr } = await (sb as any)
    .from("reclaim_requests")
    .select("id, open_id, username, expires_at, created_at")
    .eq("provider", "tikfinity")
    .eq("username", username)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reqErr) return NextResponse.json({ error: "db_error", details: reqErr.message }, { status: 500 });
  if (!reqRow?.open_id) {
    // personne n’a “armé” un reclaim sur le site → on ignore
    return NextResponse.json({ ok: true, ignored: true, reason: "no_pending_request" });
  }

  // 2) upsert live_links : on force le lien vers CET open_id (reclaim)
  //    IMPORTANT : il faut que ta table live_links ait une contrainte unique sur (provider, provider_user_id)
  const { error: upErr } = await (sb as any)
    .from("live_links")
    .upsert(
      {
        provider: "tikfinity",
        provider_user_id,
        open_id: reqRow.open_id,
        username,
        nickname,
        avatar_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,provider_user_id" }
    );

  if (upErr) return NextResponse.json({ error: "link_upsert_failed", details: upErr.message }, { status: 500 });

  // 3) supprime la demande (one-shot)
  await (sb as any).from("reclaim_requests").delete().eq("id", reqRow.id);

  return NextResponse.json({
    ok: true,
    reclaimed: true,
    provider: "tikfinity",
    provider_user_id,
    username,
    linked_open_id: reqRow.open_id,
  });
}