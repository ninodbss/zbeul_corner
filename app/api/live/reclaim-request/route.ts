// app/api/live/reclaim-request/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";

function normUsername(u: string) {
  return u.trim().replace(/^@/, "").toLowerCase();
}

export async function POST(req: Request) {
  const openId = await getOpenIdFromSession();
  if (!openId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const username = normUsername(String(body?.username ?? ""));
  if (!username) return NextResponse.json({ error: "bad_username" }, { status: 400 });

  const sb = supabaseAdmin();

  // expire dans 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await (sb as any).from("reclaim_requests").insert({
    open_id: openId,
    provider: "tikfinity",
    username,
    expires_at: expiresAt,
  });

  if (error) return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, username, expires_at: expiresAt });
}