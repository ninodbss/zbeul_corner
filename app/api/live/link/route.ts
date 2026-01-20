import { NextResponse } from "next/server";
import { getOpenIdFromSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function normUsername(u: string) {
  return u.trim().replace(/^@/, "").toLowerCase();
}

export async function POST(req: Request) {
  const openId = await getOpenIdFromSession();
  if (!openId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const raw = String(body?.username || "");
  const username = normUsername(raw);

  if (!username) return NextResponse.json({ error: "missing_username" }, { status: 400 });

  const sb = supabaseAdmin();

  // 1) on cherche le dernier event tikfinity pour ce username
  const { data: ev } = await (sb as any)
    .from("tikfinity_events")
    .select("provider_user_id,username,event_type,created_at,nickname,avatar_url")
    .eq("provider", "tikfinity")
    .ilike("username", username) // ok même si pas en lowercase côté DB
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ev?.provider_user_id) {
    return NextResponse.json(
      { error: "no_recent_event_for_username", hint: "Fais au moins un join/like en live pour créer un event Tikfinity." },
      { status: 404 }
    );
  }

  // 2) on upsert le lien (open_id ↔ provider_user_id)
  await (sb as any)
    .from("live_links")
    .upsert(
      {
        provider: "tikfinity",
        provider_user_id: String(ev.provider_user_id),
        open_id: openId,
        username: username,
        last_seen_at: ev.created_at ?? new Date().toISOString(),
      },
      { onConflict: "provider,provider_user_id" }
    );

  return NextResponse.json({
    ok: true,
    provider: "tikfinity",
    provider_user_id: String(ev.provider_user_id),
    username,
    event_type: ev.event_type ?? null,
    created_at: ev.created_at ?? null,
  });
}