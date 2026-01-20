import { NextResponse } from "next/server";
import { getOpenIdFromSession } from "../../../lib/session";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function normalizeUsername(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

/**
 * POST /api/link-live
 * Body: { username: "@monpseudo" }
 */
export async function POST(req: Request) {
  const open_id = await getOpenIdFromSession();
  if (!open_id) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const username = normalizeUsername(String(body?.username || ""));

  if (!username) return NextResponse.json({ error: "missing_username" }, { status: 400 });

  const sb = supabaseAdmin();

  // 1) Dernier event TikFinity pour ce username
  const { data: ev } = await (sb as any)
    .from("tikfinity_events")
    .select("provider_user_id, username, created_at")
    .eq("provider", "tikfinity")
    .eq("username", username)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ev?.provider_user_id) {
    return NextResponse.json({ error: "no_recent_event_for_username" }, { status: 404 });
  }

  const provider_user_id = String(ev.provider_user_id);

  // 2) Upsert du lien (open_id -> provider_user_id)
  // OnConflict sur (provider, open_id) : un open_id = un compte live
  const { error } = await (sb as any)
    .from("live_links")
    .upsert(
      {
        provider: "tikfinity",
        open_id,
        provider_user_id,
        username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,open_id" }
    );

  if (error) {
    // typiquement : provider_user_id déjà pris par un autre open_id (unique)
    return NextResponse.json({ error: "link_failed", details: String(error.message ?? error) }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    provider: "tikfinity",
    open_id,
    provider_user_id,
    username,
  });
}