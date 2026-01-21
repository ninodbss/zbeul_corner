// app/me/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { unstable_noStore as noStore } from "next/cache";
import sounds from "@/data/sounds.json";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";
import LinkLiveForm from "./LinkLiveForm";

type Sound = { id: string; title: string; artist?: string | null };

const BUILD_TAG = "ME_V3_NOSTORE_LIVE_LINK_UPDATED_AT";

export default async function MePage() {
  noStore(); // ✅ désactive le cache Next.js pour cette page

  const openId = await getOpenIdFromSession();
  if (!openId) {
    return (
      <main>
        <h1>Mon profil</h1>
        <p style={{ opacity: 0.75 }}>
          Tu n’es pas connecté. <a href="/api/auth/tiktok">Continuer avec TikTok</a>
        </p>
        <p style={{ opacity: 0.5, fontSize: 12 }}>build: {BUILD_TAG}</p>
      </main>
    );
  }

  const sb = supabaseAdmin();

  const [{ data: user }, { data: sel }, { data: liveLink }] = await Promise.all([
    (sb as any).from("users").select("display_name,avatar_url").eq("open_id", openId).maybeSingle(),
    (sb as any).from("user_sounds").select("sound_id").eq("open_id", openId).maybeSingle(),
    (sb as any)
      .from("live_links")
      .select("provider,provider_user_id,open_id,username,updated_at,nickname,avatar_url")
      .eq("open_id", openId)
      .eq("provider", "tikfinity")
      .maybeSingle(),
  ]);

  const list = sounds as unknown as Sound[];
  const chosen = sel?.sound_id ? list.find((x) => x.id === sel.sound_id) ?? null : null;

  return (
    <main>
      <h1>Mon profil</h1>

      <p style={{ opacity: 0.8, fontSize: 13 }}>
        open_id: {openId.slice(0, 8)}…
      </p>
      <p style={{ opacity: 0.5, fontSize: 12, marginTop: 6 }}>build: {BUILD_TAG}</p>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>Statut live</div>

        {liveLink?.provider_user_id ? (
          <div style={{ marginTop: 6 }}>
            ✅ Lié — <span style={{ opacity: 0.85 }}>@{liveLink.username}</span>{" "}
            <span style={{ opacity: 0.6, fontSize: 12 }}>({liveLink.provider_user_id})</span>

            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
              updated_at: {String(liveLink.updated_at)}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 6, color: "#FF7C7C" }}>❌ Pas encore lié.</div>
        )}
      </div>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>Lier mon live (sans code)</div>

        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
          Entre ton @username TikTok (une seule fois). On va chercher ton ID TikFinity via les derniers events (join/like/chat),
          puis lier ton open_id à cet ID.
        </div>

        <div style={{ marginTop: 12 }}>
          <LinkLiveForm initialUsername={liveLink?.username ?? ""} />
        </div>
      </div>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>Son sélectionné</div>

        <div style={{ marginTop: 6 }}>
          {chosen ? (
            <span>
              {chosen.title} {chosen.artist ? <span style={{ opacity: 0.75 }}>— {chosen.artist}</span> : null}
            </span>
          ) : (
            <span style={{ opacity: 0.8 }}>Aucun pour l’instant.</span>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          <a href="/sounds">Changer mon son</a>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <form action="/api/logout" method="post">
          <button
            type="submit"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}