export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";

export async function GET(req: Request) {
  const open_id = await getOpenIdFromSession();
  if (!open_id) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawQ = String(searchParams.get("q") ?? "");
  const q = rawQ.replace(/^@+/, "").trim().toLowerCase();
  const limit = Math.min(20, Math.max(1, parseInt(String(searchParams.get("limit") ?? "8"), 10) || 8));

  if (!q || q.length < 1) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const sb = supabaseAdmin();

  const { data, error } = await (sb as any).rpc("live_suggest", { q, lim: limit });

  if (error) {
    return NextResponse.json({ error: "db_error", details: String(error.message ?? error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data ?? [] });
}