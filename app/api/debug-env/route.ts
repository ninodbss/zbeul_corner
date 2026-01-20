// app/api/debug-env/route.ts
import { NextResponse } from "next/server";

function maskHost(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.host; // ex: emgbgcyfjojuetmjqnqj.supabase.co
  } catch {
    return "invalid_url";
  }
}

export async function GET() {
  return NextResponse.json({
    // TikTok
    TIKTOK_USE_SANDBOX: process.env.TIKTOK_USE_SANDBOX ?? null,
    has_TIKTOK_CLIENT_KEY: Boolean(process.env.TIKTOK_CLIENT_KEY),
    has_TIKTOK_CLIENT_SECRET: Boolean(process.env.TIKTOK_CLIENT_SECRET),
    has_TIKTOK_SANDBOX_CLIENT_KEY: Boolean(process.env.TIKTOK_SANDBOX_CLIENT_KEY),
    has_TIKTOK_SANDBOX_CLIENT_SECRET: Boolean(process.env.TIKTOK_SANDBOX_CLIENT_SECRET),
    has_TIKTOK_REDIRECT_URI: Boolean(process.env.TIKTOK_REDIRECT_URI),

    // Supabase (⚠️ on n’affiche pas les valeurs, juste présence + host)
    has_SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_HOST: maskHost(process.env.SUPABASE_URL),
    has_SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),

    // Bridge / session
    has_BRIDGE_API_KEY: Boolean(process.env.BRIDGE_API_KEY),
    has_SESSION_SECRET: Boolean(process.env.SESSION_SECRET),

    // Infos Vercel
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
  });
}