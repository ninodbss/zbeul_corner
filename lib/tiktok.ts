export function buildTikTokAuthorizeUrl(state: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !redirectUri) throw new Error("Missing TIKTOK_CLIENT_KEY or TIKTOK_REDIRECT_URI");

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: "user.info.basic",
    redirect_uri: redirectUri,
    state,
    disable_auto_auth: "0"
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error("Missing TikTok OAuth env vars");
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri
  });

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const json = await res.json();
  if (!res.ok || json?.error) {
    throw new Error(`TikTok token exchange failed: ${JSON.stringify(json)}`);
  }
  return json as {
    access_token: string;
    expires_in: number;
    open_id: string;
    refresh_expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
  };
}

export async function fetchUserInfo(accessToken: string) {
  const fields = "open_id,union_id,avatar_url,display_name";
  const url = `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = await res.json();

  if (!res.ok || json?.error?.code !== "ok") {
    throw new Error(`TikTok user info failed: ${JSON.stringify(json)}`);
  }

  return json.data.user as {
    open_id: string;
    union_id?: string;
    avatar_url?: string;
    display_name?: string;
  };
}
