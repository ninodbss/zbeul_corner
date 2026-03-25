import { NextResponse } from "next/server";
import { buildTikTokAuthorizeUrl } from "../../../../lib/tiktok";
import { createTikTokState } from "../../../../lib/tiktokState";

export async function GET() {
  const state = createTikTokState();
  const url = buildTikTokAuthorizeUrl(state);
  return NextResponse.redirect(url);
}
