import { NextResponse } from "next/server";
import { exchangeCodeForToken, fetchUserInfo } from "../../../../../lib/tiktok";
import { verifyTikTokState } from "../../../../../lib/tiktokState";
import { setSession } from "../../../../../lib/session";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.json({ error, errorDescription }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json(
      {
        error: "invalid_state",
        has_query_state: Boolean(state),
        host: new URL(req.url).host,
        reason: "missing_state",
      },
      { status: 400 }
    );
  }

  const stateCheck = verifyTikTokState(state);
  if (!stateCheck.ok) {
    return NextResponse.json(
      {
        error: "invalid_state",
        has_query_state: true,
        host: new URL(req.url).host,
        reason: stateCheck.reason,
      },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const token = await exchangeCodeForToken(code);
  const user = await fetchUserInfo(token.access_token);

  const sb = supabaseAdmin();

  // ✅ cast any pour éviter le "never" tant que tu n'as pas de types Supabase générés
  await (sb as any).from("users").upsert(
    {
      open_id: user.open_id,
      union_id: user.union_id ?? null,
      display_name: user.display_name ?? null,
      avatar_url: user.avatar_url ?? null,
    },
    { onConflict: "open_id" }
  );

  // ✅ session cookie
  await setSession(user.open_id);

  // ✅ retour à la home
  return NextResponse.redirect(new URL("/", req.url));
}
