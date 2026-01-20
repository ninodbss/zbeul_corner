import { NextResponse } from "next/server";
import { buildTikTokAuthorizeUrl } from "@/lib/tiktok";

export async function GET() {
  const url = buildTikTokAuthorizeUrl("TEST_STATE_123");
  return NextResponse.json({
    url,
    useSandbox: process.env.TIKTOK_USE_SANDBOX ?? null,
    hasClientKey: !!process.env.TIKTOK_CLIENT_KEY,
    hasSandboxKey: !!process.env.TIKTOK_SANDBOX_CLIENT_KEY,
    hasClientSecret: !!process.env.TIKTOK_CLIENT_SECRET,
    hasSandboxSecret: !!process.env.TIKTOK_SANDBOX_CLIENT_SECRET,
    redirect: process.env.TIKTOK_REDIRECT_URI ?? null,
  });
}