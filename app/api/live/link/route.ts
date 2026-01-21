export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";

function normalizeUsername(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

/**
 * POST /api/live/link
 * Body: { username: string } // "@xxx" ou "xxx"
 *
 * Option A (sans PIN):
 * - trouve le dernier event dans tikfinity_events pour ce username
 * - récupère provider_user_id
 * - lie open_id <-> provider_user_id dans live_links
 * - anti-usurpation: si provider_user_id déjà lié à un autre open_id => refuse (409)
 *
 * IMPORTANT: ta table live_links a updated_at (pas last_seen_at)
 * Et tes contraintes: PK(provider, provider_user_id) + unique(provider, open_id)
 */
export async function POST(req: Request) {
  try {
    const open_id = await getOpenIdFromSession();
    if (!open_id) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(String(body?.username ?? ""));
    if (!username) {
      return NextResponse.json({ error: "missing_username" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    // 1) Dernier event pour ce username (join/like/chat...)
    const { data: ev, error: evErr } = await (sb as any)
      .from("tikfinity_events")
      .select("provider_user_id, username, event_type, created_at, nickname, avatar_url")
      .eq("provider", "tikfinity")
      .ilike("username", username)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (evErr) {
      return NextResponse.json(
        { error: "db_error", details: String(evErr?.message ?? evErr) },
        { status: 500 }
      );
    }

    if (!ev?.provider_user_id) {
      return NextResponse.json(
        {
          error: "no_recent_event_for_username",
          hint:
            "Ce @username n'a pas été vu récemment. Fais un join/like/chat en live (ou via ton endpoint bridge/event) pour créer un event, puis réessaie.",
        },
        { status: 404 }
      );
    }

    const provider_user_id = String(ev.provider_user_id);
    const seenAt = ev.created_at ?? new Date().toISOString();

    // 2) Anti-usurpation: si ce provider_user_id est déjà lié à un AUTRE open_id => refuse
    const { data: existing, error: exErr } = await (sb as any)
      .from("live_links")
      .select("open_id, username, updated_at")
      .eq("provider", "tikfinity")
      .eq("provider_user_id", provider_user_id)
      .maybeSingle();

    if (exErr) {
      return NextResponse.json(
        { error: "db_error", details: String(exErr?.message ?? exErr) },
        { status: 500 }
      );
    }

    if (existing?.open_id && existing.open_id !== open_id) {
      return NextResponse.json(
        {
          error: "already_linked",
          hint:
            "Ce compte live est déjà lié à un autre compte du site. (Plus tard: récupération via commande !link en chat).",
        },
        { status: 409 }
      );
    }

    // 3) Upsert du lien pour CET open_id (unique sur provider+open_id)
    // -> permet à l'utilisateur de relier son open_id à un nouveau provider_user_id si besoin
    const payload = {
      provider: "tikfinity",
      open_id,
      provider_user_id,
      username, // normalisé
      nickname: ev.nickname ?? null,
      avatar_url: ev.avatar_url ?? null,
      updated_at: seenAt,
    };

    const { error: upErr } = await (sb as any)
      .from("live_links")
      .upsert(payload, { onConflict: "provider,open_id" });

    if (upErr) {
      return NextResponse.json(
        { error: "db_error", details: String(upErr?.message ?? upErr) },
        { status: 500 }
      );
    }
    const BUILD_TAG = "LIVE_LINK_V2_NO_LAST_SEEN_AT";
    return NextResponse.json({
        ok: true,
        build: BUILD_TAG,
        provider: "tikfinity",
        provider_user_id,
        username,
        updated_at: payload.updated_at,
    });
  } catch (e: any) {
    return NextResponse.json(
        { error: "server_error", build: "LIVE_LINK_V2_NO_LAST_SEEN_AT", details: String(e?.message ?? e) },
        { status: 500 }
    );
  }
}