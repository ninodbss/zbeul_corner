import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { buildTikTokAuthorizeUrl } from "../../../../lib/tiktok";

export async function GET() {
  const state = crypto.randomBytes(18).toString("base64url");
  cookies().set("tt_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });

  const url = buildTikTokAuthorizeUrl(state);
  return NextResponse.redirect(url);
}
