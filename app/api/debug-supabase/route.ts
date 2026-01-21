export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function authOk(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-api-key");
  return Boolean(key && key === process.env.BRIDGE_API_KEY);
}

export async function GET(req: Request) {
  if (!authOk(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const sb = supabaseAdmin();
    const { data, error } = await (sb as any)
      .from("tikfinity_events")
      .select("id")
      .limit(1);

    if (error) return NextResponse.json({ ok: false, stage: "query", detail: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, sampleCount: (data ?? []).length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: "exception", detail: String(e?.message ?? e) }, { status: 500 });
  }
}