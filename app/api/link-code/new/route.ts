import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function authOk(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-api-key");
  return Boolean(key && key === process.env.BRIDGE_API_KEY);
}

function genCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function POST(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId || "").trim();
  if (!userId) {
    return NextResponse.json({ error: "missing_userId" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  let lastError: unknown = null;

  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const { error } = await sb.from("link_codes").insert({
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

  const error = lastError as { message?: string; cause?: { message?: string; code?: string; errno?: number; syscall?: string } } | null;

  return NextResponse.json(
    {
      error: "failed_to_create_code",
      detail: error?.message || String(lastError),
      cause: error?.cause?.message || null,
      code: error?.cause?.code || null,
      errno: error?.cause?.errno || null,
      syscall: error?.cause?.syscall || null,
    },
    { status: 500 }
  );
}
