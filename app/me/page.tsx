import sounds from "../../data/sounds.json";
import { getOpenIdFromSession } from "../../lib/session";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import LinkCodeForm from "./LinkCodeForm";

type Sound = { id: string; title: string; artist?: string };

export default async function MePage() {
  const openId = await getOpenIdFromSession();
  if (!openId) {
    return (
      <main>
        <h1>Mon profil</h1>
        <p>
          Tu n’es pas connecté. <a href="/api/auth/tiktok">Continuer avec TikTok</a>
        </p>
      </main>
    );
  }

  const sb = supabaseAdmin();

  const [{ data: user }, { data: sel }, { data: link }] = await Promise.all([
    (sb as any).from("users").select("display_name,avatar_url").eq("open_id", openId).maybeSingle(),
    (sb as any).from("user_sounds").select("sound_id").eq("open_id", openId).maybeSingle(),
    (sb as any)
      .from("live_links")
      .select("provider,provider_user_id,username,last_seen_at")
      .eq("open_id", openId)
      .eq("provider", "tikfinity")
      .maybeSingle(),
  ]);

  const list = sounds as unknown as Sound[];
  const chosen = sel?.sound_id ? list.find((x) => x.id === sel.sound_id) ?? null : null;

  return (
    <main>
      <h1>Mon profil</h1>
      <p style={{ opacity: 0.8, fontSize: 13 }}>open_id: {openId.slice(0, 8)}…</p>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
        <div style={{ fontWeight: 800 }}>Statut live</div>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
          {link?.provider_user_id ? (
            <>
              ✅ Lié à <code>{link.username || "(username inconnu)"}</code> — provider_user_id:{" "}
              <code>{link.provider_user_id}</code>
              {link.last_seen_at ? <> (last_seen: {String(link.last_seen_at)})</> : null}
            </>
          ) : (
            <>❌ Pas encore lié.</>
          )}
        </div>
      </div>

      {/* ✅ Option A: formulaire username */}
      <LinkCodeForm />

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
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
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ccc", cursor: "pointer" }}
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
