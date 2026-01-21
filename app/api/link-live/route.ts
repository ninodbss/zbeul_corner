export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getOpenIdFromSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function normalizeUsername(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

/**
 * POST /api/link-live
 * Body: { username: "@monpseudo" }
 *
 * Même logique que /api/live/link
 */
export async function POST(req: Request) {
  try {
    const open_id = await getOpenIdFromSession();
    if (!open_id) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(String(body?.username || ""));
    if (!username) return NextResponse.json({ error: "missing_username" }, { status: 400 });

    const sb = supabaseAdmin();

    const { data: ev, error: evErr } = await (sb as any)
      .from("tikfinity_events")
      .select("provider_user_id, username, created_at, nickname, avatar_url")
      .eq("provider", "tikfinity")
      .ilike("username", username)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (evErr) {
      return NextResponse.json({ error: "db_error", details: String(evErr?.message ?? evErr) }, { status: 500 });
    }

    if (!ev?.provider_user_id) {
      return NextResponse.json({ error: "no_recent_event_for_username" }, { status: 404 });
    }

    const provider_user_id = String(ev.provider_user_id);
    const seenAt = ev.created_at ?? new Date().toISOString();

    // Anti-usurpation
    const { data: existing, error: exErr } = await (sb as any)
      .from("live_links")
      .select("open_id")
      .eq("provider", "tikfinity")
      .eq("provider_user_id", provider_user_id)
      .maybeSingle();

    if (exErr) {
      return NextResponse.json({ error: "db_error", details: String(exErr?.message ?? exErr) }, { status: 500 });
    }

    if (existing?.open_id && existing.open_id !== open_id) {
      return NextResponse.json(
        {
          error: "already_linked",
          hint: "Déjà lié à quelqu'un d'autre. (Plus tard: commande !link pour récupérer).",
        },
        { status: 409 }
      );
    }

    const payload = {
      provider: "tikfinity",
      open_id,
      provider_user_id,
      username,
      nickname: ev.nickname ?? null,
      avatar_url: ev.avatar_url ?? null,
      updated_at: seenAt,
    };

    const { error } = await (sb as any)
      .from("live_links")
      .upsert(payload, { onConflict: "provider,open_id" });

    if (error) {
      return NextResponse.json({ error: "link_failed", details: String(error.message ?? error) }, { status: 409 });
    }

    return NextResponse.json({ ok: true, provider: "tikfinity", open_id, provider_user_id, username, updated_at: payload.updated_at });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: String(e?.message ?? e) }, { status: 500 });
  }
}