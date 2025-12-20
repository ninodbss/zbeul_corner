import sounds from "../../data/sounds.json";
import { getOpenIdFromSession } from "../../lib/session";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

type Sound = {
  id: string;
  title: string;
  artist?: string;
  durationSec?: number;
  region?: string;
  cmlUrl?: string;
  tags?: string[];
};

export default async function SoundsPage() {
  const openId = await getOpenIdFromSession();
  let selected: string | null = null;

  if (openId) {
    const sb = supabaseAdmin();
    const { data } = await sb.from("user_sounds").select("sound_id").eq("open_id", openId).maybeSingle();
    selected = data?.sound_id ?? null;
  }

  const list = (sounds as unknown as Sound[]);

  return (
    <main>
      <h1>Catalogue (CML)</h1>
      <p style={{ lineHeight: 1.5 }}>
        Tu sÃ©lectionnes un son dans ta liste curÃ©e (pas de scraping).
      </p>

      {!openId && (
        <div style={{ padding: 12, border: "1px solid #ffd6d6", borderRadius: 10, background: "#fff7f7" }}>
          <b>Tu nâ€™es pas connectÃ©.</b> <a href="/api/auth/tiktok">Connecte-toi avec TikTok</a> pour enregistrer ton choix.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 14 }}>
        {list.map((s) => (
          <div key={s.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{s.title}</div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>{s.artist ?? "â€”"}</div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
              {s.cmlUrl ? (
                <a href={s.cmlUrl} target="_blank" rel="noreferrer">
                  Ouvrir dans Creative Center
                </a>
              ) : (
                <span style={{ fontSize: 12, opacity: 0.7 }}>Lien Creative Center non fourni</span>
              )}

              {openId ? (
                <form action="/api/select-sound" method="post" style={{ marginLeft: "auto" }}>
                  <input type="hidden" name="sound_id" value={s.id} />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #ccc",
                      cursor: "pointer",
                      background: selected === s.id ? "black" : "white",
                      color: selected === s.id ? "white" : "black"
                    }}
                  >
                    {selected === s.id ? "SÃ©lectionnÃ© âœ…" : "Choisir"}
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}


