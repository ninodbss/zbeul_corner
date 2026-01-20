import { NextResponse } from "next/server";
import crypto from "node:crypto";
import sounds from "@/data/sounds.json";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function authOk(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || req.headers.get("x-api-key");
  return Boolean(key && key === process.env.BRIDGE_API_KEY);
}

function pickDeterministicSoundId(userId: string): string | null {
  const list = (sounds as any[]).map((s) => s?.id).filter(Boolean) as string[];
  if (list.length === 0) return null;

  const hex = crypto.createHash("sha256").update(userId).digest("hex").slice(0, 8);
  const n = parseInt(hex, 16);
  return list[n % list.length]!;
}

/**
 * POST /api/bridge/join
 * Header: x-api-key: BRIDGE_API_KEY
 * Body: { userId, username, nickname, avatar_url }
 *
 * Réponse:
 * { provider_user_id, nickname, avatar_url, sound_id, linked_open_id? }
 */
export async function POST(req: Request) {
  if (!authOk(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId || "").trim();
  const username = body?.username ? String(body.username) : null;
  const nickname = body?.nickname ? String(body.nickname) : null;
  const avatar_url = body?.avatar_url ? String(body.avatar_url) : null;

  if (!userId) return NextResponse.json({ error: "missing_userId" }, { status: 400 });

  // 1) On check si ce userId tikfinity est lié à un open_id (config site)
  const sb = supabaseAdmin();

  const { data: link } = await (sb as any)
    .from("live_links")
    .select("open_id")
    .eq("provider", "tikfinity")
    .eq("provider_user_id", userId)
    .maybeSingle();

  let sound_id: string | null = null;

  if (link?.open_id) {
    // 2) Si lié: on récupère le sound_id choisi sur le site
    const { data: sel } = await (sb as any)
      .from("user_sounds")
      .select("sound_id")
      .eq("open_id", link.open_id)
      .maybeSingle();

    sound_id = sel?.sound_id ?? null;
  }

  // 3) Sinon: son par défaut déterministe (stable)
  if (!sound_id) sound_id = pickDeterministicSoundId(userId);

  return NextResponse.json({
    provider: "tikfinity",
    provider_user_id: userId,
    username,
    nickname,
    avatar_url,
    sound_id,
    linked_open_id: link?.open_id ?? null,
  });
}
