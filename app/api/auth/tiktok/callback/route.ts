import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken, fetchUserInfo } from "../../../../../lib/tiktok";
import { setSession } from "../../../../../lib/session";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) return NextResponse.json({ error, errorDescription }, { status: 400 });

  const cookieState = cookies().get("tt_state")?.value;
  if (!cookieState || !state || cookieState !== state) {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }

  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

  const token = await exchangeCodeForToken(code);
  const user = await fetchUserInfo(token.access_token);

  const sb = supabaseAdmin();
  await sb.from("users").upsert({
    open_id: user.open_id,
    union_id: user.union_id ?? null,
    display_name: user.display_name ?? "TikTok user",
    avatar_url: user.avatar_url ?? null
  }, { onConflict: "open_id" });

  setSession(user.open_id);
  return NextResponse.redirect(new URL("/sounds", req.url));
}
