import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { buildTikTokAuthorizeUrl } from "../../../../lib/tiktok";

export async function GET() {
  const state = crypto.randomBytes(18).toString("base64url");

  const cookieStore = await cookies();
  cookieStore.set("tt_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });

  const url = buildTikTokAuthorizeUrl(state);
  return NextResponse.redirect(url);
}
