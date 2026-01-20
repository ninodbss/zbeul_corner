import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function authOk(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-api-key");
  return Boolean(key && key === process.env.BRIDGE_API_KEY);
}

function genCode() {
  // 6 chars lisibles, évite 0/O/1/I
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/**
 * POST /api/link-code/new
 * Header: x-api-key: BRIDGE_API_KEY
 * Body: { userId }
 * -> { code, expires_at }
 */
export async function POST(req: Request) {
  if (!authOk(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId || "").trim();
  if (!userId) return NextResponse.json({ error: "missing_userId" }, { status: 400 });

  const sb = supabaseAdmin();

  // expire 10 minutes
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  let lastError: any = null;

  for (let i = 0; i < 5; i++) {
    const code = genCode();

    const { error } = await (sb as any).from("link_codes").insert({
      code,
      provider: "tikfinity",
      provider_user_id: userId,
      expires_at: expires,
    });

    if (!error) {
      return NextResponse.json({ code, expires_at: expires });
    }

    lastError = error;
  }

  const cause: any = (lastError as any)?.cause;

  return NextResponse.json(
    {
      error: "failed_to_create_code",
      detail: lastError?.message || String(lastError),
      cause: cause?.message || String(cause || ""),
      code: cause?.code || null,
      errno: cause?.errno || null,
      syscall: cause?.syscall || null,
    },
    { status: 500 }
  );
}
