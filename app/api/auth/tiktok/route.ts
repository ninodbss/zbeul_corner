import { NextResponse } from "next/server";
import crypto from "crypto";
import { buildTikTokAuthorizeUrl } from "../../../../lib/tiktok";

export async function GET() {
  const state = crypto.randomBytes(18).toString("base64url");

  const url = buildTikTokAuthorizeUrl(state);
  const response = NextResponse.redirect(url);

  response.cookies.set("tt_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
