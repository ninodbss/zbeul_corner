// app/api/live/suggest/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// --- helpers (fuzzy) ---
function normalize(s: string) {
  return (s ?? "").trim().toLowerCase().replace(/^@+/, "");
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n];
}

function scoreCandidate(q: string, username: string, nickname?: string | null) {
  const uq = normalize(q);
  const u = normalize(username);
  const n = normalize(nickname ?? "");

  if (!uq) return 0;

  let score = 0;

  // gros boost si ça commence pareil
  if (u.startsWith(uq)) score += 120;
  else if (u.includes(uq)) score += 70;

  // nickname aide un peu (si les gens tapent le pseudo visible)
  if (n && n.includes(uq)) score += 30;

  // distance d'édition (petites fautes)
  const dist = levenshtein(uq, u);
  score += Math.max(0, 35 - dist * 5);

  return score;
}

type Row = {
  provider_user_id: string | number | null;
  username: string | null;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = url.searchParams.get("q") ?? "";
    const q = normalize(qRaw);
    const limit = Math.min(25, Math.max(1, parseInt(url.searchParams.get("limit") ?? "8", 10) || 8));

    const sb = supabaseAdmin();

    // On récupère des events récents, puis on déduplique par username
    // (et on score en JS pour la similarité).
    let query = (sb as any)
      .from("tikfinity_events")
      .select("provider_user_id, username, nickname, avatar_url, created_at")
      .eq("provider", "tikfinity")
      .order("created_at", { ascending: false })
      .limit(300);

    // Petit filtre SQL si q existe, pour éviter trop de data
    if (q) {
      query = query.ilike("username", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "db_error", details: String(error.message ?? error) },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const rows = (data ?? []) as Row[];

    // Dédup par username (on garde le plus récent)
    const map = new Map<string, Row>();
    for (const r of rows) {
      const u = normalize(String(r.username ?? ""));
      if (!u) continue;
      if (!map.has(u)) map.set(u, r);
    }

    let items = Array.from(map.entries()).map(([u, r]) => {
      const baseScore = q ? scoreCandidate(q, u, r.nickname) : 0;

      // petit boost récence: les premiers dans la liste sont plus récents
      // (ça évite qu’un match “moyen” ancien dépasse un match “ok” récent)
      const recencyBoost = 0;

      return {
        provider: "tikfinity" as const,
        provider_user_id: r.provider_user_id ? String(r.provider_user_id) : null,
        username: u,
        nickname: r.nickname ?? null,
        avatar_url: r.avatar_url ?? null,
        created_at: r.created_at ?? null,
        score: baseScore + recencyBoost,
      };
    });

    // tri: score desc puis created_at desc
    items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });

    // Si q est vide → on renvoie juste les plus récents
    if (!q) {
      items = items.slice(0, limit);
    } else {
      // garde uniquement ceux qui matchent un minimum
      items = items.filter((x) => x.score > 0).slice(0, limit);
    }

    return NextResponse.json(
      { ok: true, q: qRaw, limit, items },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", details: String(e?.message ?? e) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}