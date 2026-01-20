import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    TIKTOK_USE_SANDBOX: process.env.TIKTOK_USE_SANDBOX ?? null,
    TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY ? "set" : null,
    TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI ? "set" : null,
  });
}