import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";

/**
 * POST /api/link-code/resolve
 * Body: { code }
 * -> { ok:true, provider_user_id }
 */
export async function POST(req: Request) {
  const openId = await getOpenIdFromSession();
  if (!openId) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

  const sb = supabaseAdmin();

  // 1) lire le code
  const { data: row, error: e1 } = await (sb as any)
    .from("link_codes")
    .select("code, provider, provider_user_id, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (e1) return NextResponse.json({ error: "db_error", detail: e1.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  const exp = new Date(row.expires_at).getTime();
  if (Number.isNaN(exp) || exp < Date.now()) {
    // on peut cleanup
    await (sb as any).from("link_codes").delete().eq("code", code);
    return NextResponse.json({ error: "expired_code" }, { status: 400 });
  }

  // 2) upsert live_links
  const { error: e2 } = await (sb as any)
    .from("live_links")
    .upsert(
      {
        provider: row.provider,
        provider_user_id: row.provider_user_id,
        open_id: openId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,provider_user_id" }
    );

  if (e2) return NextResponse.json({ error: "db_error", detail: e2.message }, { status: 500 });

  // 3) supprimer le code (one-time)
  await (sb as any).from("link_codes").delete().eq("code", code);

  return NextResponse.json({ ok: true, provider_user_id: row.provider_user_id });
}

