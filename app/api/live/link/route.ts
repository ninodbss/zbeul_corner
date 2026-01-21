import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";

/**
 * POST /api/live/link
 * Body: { username: string }  // accepte "@xxx" ou "xxx"
 *
 * Logique Option A (sans PIN):
 * - on cherche le dernier event tikfinity_events pour ce username
 * - on récupère provider_user_id
 * - on lie open_id <-> provider_user_id dans live_links
 * - sécurité: si ce provider_user_id est déjà lié à un autre open_id => refuse (anti-usurpation)
 */
export async function POST(req: Request) {
  const openId = await getOpenIdFromSession();
  if (!openId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // username normalisé: sans "@", trim, lower
  const raw = String(body?.username ?? "");
  const username = raw.replace(/^@/, "").trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: "missing_username" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // 1) Dernier event (join/like/chat...) pour ce username
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
          "Ce @username n'a pas été vu récemment. Fais un join/like/comment en live (ou sur ton test live) pour générer un event TikFinity, puis réessaie.",
      },
      { status: 404 }
    );
  }

  const provider_user_id = String(ev.provider_user_id);

  // 2) Anti-usurpation: si déjà lié à un autre open_id => refuse
  const { data: existing, error: exErr } = await (sb as any)
    .from("live_links")
    .select("open_id, username, last_seen_at")
    .eq("provider", "tikfinity")
    .eq("provider_user_id", provider_user_id)
    .maybeSingle();

  if (exErr) {
    return NextResponse.json(
      { error: "db_error", details: String(exErr?.message ?? exErr) },
      { status: 500 }
    );
  }

  if (existing?.open_id && existing.open_id !== openId) {
    return NextResponse.json(
      {
        error: "already_linked",
        hint:
          "Ce compte live est déjà lié à un autre compte du site. Si c'est toi, tu pourras le récupérer plus tard via une commande en chat (!link).",
      },
      { status: 409 }
    );
  }

  // 3) Upsert du lien (libre ou déjà à toi)
  const payload = {
    provider: "tikfinity",
    provider_user_id,
    open_id: openId,
    username, // username normalisé
    last_seen_at: ev.created_at ?? new Date().toISOString(),
  };

  const { error: upErr } = await (sb as any)
    .from("live_links")
    .upsert(payload, { onConflict: "provider,provider_user_id" });

  if (upErr) {
    return NextResponse.json(
      { error: "db_error", details: String(upErr?.message ?? upErr) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "tikfinity",
    provider_user_id,
    username,
    last_seen_at: payload.last_seen_at,
  });
}