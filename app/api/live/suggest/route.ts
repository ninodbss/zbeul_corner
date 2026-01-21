export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

// Score simple: prefix > substring + bonus récence
function scoreItem(q: string, username: string, nickname?: string | null, createdAt?: string | null) {
  const qq = norm(q);
  const u = norm(username);
  const n = norm(nickname ?? "");

  let score = 0;

  // username match
  if (u === qq) score += 1000;
  if (u.startsWith(qq)) score += 500;
  if (u.includes(qq)) score += 200;

  // nickname match (plus léger)
  if (n && n.startsWith(qq)) score += 80;
  if (n && n.includes(qq)) score += 40;

  // récence: plus récent => + (max 120)
  if (createdAt) {
    const t = new Date(createdAt).getTime();
    if (!Number.isNaN(t)) {
      const ageMs = Date.now() - t;
      const ageMin = Math.max(0, ageMs / 60000);
      const recency = Math.max(0, 120 - ageMin); // 0..120
      score += recency;
    }
  }

  return score;
}

/**
 * GET /api/live/suggest?q=fl&limit=8
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = norm(url.searchParams.get("q") ?? "");
  const limit = Math.max(1, Math.min(20, parseInt(url.searchParams.get("limit") ?? "8", 10) || 8));

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const sb = supabaseAdmin();

  // On fetch un peu plus que limit puis on dédupe + score
  const FETCH_N = 60;

  const { data, error } = await (sb as any)
    .from("tikfinity_events")
    .select("provider_user_id,username,nickname,avatar_url,created_at")
    .eq("provider", "tikfinity")
    .or(`username.ilike.%${q}%,nickname.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(FETCH_N);

  if (error) {
    return NextResponse.json(
      { error: "db_error", details: String(error?.message ?? error) },
      { status: 500 }
    );
  }

  const raw = Array.isArray(data) ? data : [];

  // Dédoublonnage par provider_user_id (le plus récent gagne)
  const byId = new Map<string, any>();
  for (const row of raw) {
    const id = String(row?.provider_user_id ?? "");
    if (!id) continue;
    if (!byId.has(id)) byId.set(id, row);
  }

  const items = Array.from(byId.values())
    .map((row) => {
      const username = String(row?.username ?? "");
      const nickname = row?.nickname ? String(row.nickname) : null;
      const avatar_url = row?.avatar_url ? String(row.avatar_url) : null;
      const created_at = row?.created_at ? String(row.created_at) : null;
      const provider_user_id = String(row?.provider_user_id ?? "");

      return {
        provider_user_id,
        username,
        nickname,
        avatar_url,
        created_at,
        _score: scoreItem(q, username, nickname, created_at),
      };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...rest }) => rest);

  return NextResponse.json({ items });
}

