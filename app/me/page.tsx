import sounds from "../../data/sounds.json";
import crypto from "crypto";
import { getOpenIdFromSession } from "../../lib/session";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

type Sound = { id: string; title: string; artist?: string };

function makeLinkCode(openId: string, secret: string) {
  const h = crypto.createHmac("sha256", secret).update(openId).digest();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[h[i] % alphabet.length];
  return out;
}

export default async function MePage() {
  const openId = await getOpenIdFromSession(); // ✅ IMPORTANT: await
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
  const [{ data: user }, { data: sel }] = await Promise.all([
    sb.from("users").select("display_name,avatar_url").eq("open_id", openId).maybeSingle(),
    sb.from("user_sounds").select("sound_id").eq("open_id", openId).maybeSingle()
  ]);

  const secret = process.env.SESSION_SECRET ?? "dev";
  const linkCode = makeLinkCode(openId, secret);

  const list = sounds as unknown as Sound[];
  const chosen = sel?.sound_id ? list.find((x) => x.id === sel.sound_id) ?? null : null;

  return (
    <main>
      <h1>Mon profil</h1>

      <p style={{ opacity: 0.8, fontSize: 13 }}>open_id: {openId.slice(0, 8)}…</p>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>Code de liaison LIVE</div>
        <div style={{ fontSize: 24, letterSpacing: 2, marginTop: 6 }}>{linkCode}</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
          Dans le live: tape <code>!link {linkCode}</code> (à brancher côté bot/bridge).
        </div>
      </div>

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
          <button type="submit" style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ccc", cursor: "pointer" }}>
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
