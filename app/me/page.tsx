import Link from "next/link";
import { getOpenIdFromSession } from "@/lib/session";
import { getSoundById } from "@/lib/sounds";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import LinkLiveForm from "./LinkLiveForm";

type PageProps = {
  searchParams?: Promise<{ ok?: string }> | { ok?: string };
};

export default async function MePage({ searchParams }: PageProps) {
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const openId = await getOpenIdFromSession();

  if (!openId) {
    return (
      <main className="page-shell">
        <section className="card page-header-main reveal">
          <span className="eyebrow">Espace personnel</span>
          <div className="stack">
            <h1>Ton profil sera disponible apres connexion.</h1>
            <p className="lede">
              Connecte ton compte TikTok pour afficher ton identifiant, ton son actif et l’etat de liaison de ton live.
            </p>
          </div>
          <div className="actions">
            <a className="btn btn-primary" href="/api/auth/tiktok">Continuer avec TikTok</a>
            <Link className="btn btn-secondary" href="/sounds">Voir les sons</Link>
          </div>
        </section>
      </main>
    );
  }

  const sb = supabaseAdmin();
  const [{ data: user }, { data: sel }, { data: liveLink }] = await Promise.all([
    sb.from("users").select("display_name,avatar_url").eq("open_id", openId).maybeSingle(),
    sb.from("user_sounds").select("sound_id,updated_at").eq("open_id", openId).maybeSingle(),
    sb
      .from("live_links")
      .select("provider,provider_user_id,username,updated_at,nickname,avatar_url")
      .eq("open_id", openId)
      .eq("provider", "tikfinity")
      .maybeSingle(),
  ]);

  const chosen = sel?.sound_id ? getSoundById(sel.sound_id) : null;
  const displayName = user?.display_name ?? "TikTok creator";
  const avatarLetter = displayName.slice(0, 1).toUpperCase();
  const soundSaved = params.ok === "sound";

  return (
    <main className="page-shell">
      {soundSaved ? (
        <div className="notice ok reveal">
          <div>
            <strong>Son enregistre</strong>
            <p>Ta selection a bien ete sauvegardee et sera disponible pour le bridge live.</p>
          </div>
        </div>
      ) : null}

      <section className="profile-grid reveal">
        <div className="card profile-card">
          <span className="eyebrow">Profil connecte</span>
          <div className="profile-head">
            {user?.avatar_url ? (
              <img className="avatar" src={user.avatar_url} alt={displayName} />
            ) : (
              <div className="avatar avatar-fallback">{avatarLetter}</div>
            )}
            <div>
              <h1>{displayName}</h1>
              <p>Ton espace centralise ton identifiant TikTok, ton son actif et la liaison de ton live.</p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-tile">
              <span className="info-label">Open ID</span>
              <span className="info-value">{openId.slice(0, 8)}...</span>
            </div>
            <div className="info-tile">
              <span className="info-label">Statut live</span>
              <span className="info-value">{liveLink?.provider_user_id ? "Live lie" : "A lier"}</span>
            </div>
          </div>
        </div>

        <aside className="card aside-card">
          <span className="kicker">Liaison live</span>
          <h2>{liveLink?.provider_user_id ? "Ton live est deja rattache." : "Relie ton compte live."}</h2>
          <p className="helper">
            {liveLink?.provider_user_id
              ? `Compte detecte: @${liveLink.username ?? "inconnu"} (${liveLink.provider_user_id}).`
              : "Entre ton @username TikTok pour retrouver ton identifiant TikFinity depuis les evenements recents."}
          </p>
          <div className="tag-row" style={{ marginTop: 12 }}>
            {liveLink?.provider_user_id ? (
              <>
                <span className="tag">Provider tikfinity</span>
                <span className="tag">{liveLink.provider_user_id}</span>
              </>
            ) : (
              <span className="tag">Aucun lien live actif</span>
            )}
          </div>
        </aside>
      </section>

      <section className="grid reveal reveal-delay-1">
        <div className="card feature-card col4">
          <span className="kicker">Son actif</span>
          <h2>{chosen ? chosen.title : "Aucun son selectionne"}</h2>
          <p className="support">
            {chosen
              ? `${chosen.artist ? `${chosen.artist} · ` : ""}Ce son sera remonte au bridge pour les evenements live.`
              : "Choisis un titre dans le catalogue pour activer un son de leader sur ton profil."}
          </p>
          <Link className="btn btn-secondary" href="/sounds">
            {chosen ? "Changer mon son" : "Choisir un son"}
          </Link>
        </div>

        <div className="card feature-card col4">
          <span className="kicker">Lier mon live</span>
          <h2>Connexion sans code</h2>
          <p className="support">
            Le site cherche les derniers evenements de ton compte live puis rattache ton profil Marble Live au bon `provider_user_id`.
          </p>
          <LinkLiveForm initialUsername={liveLink?.username ?? ""} />
        </div>

        <div className="card feature-card col4">
          <span className="kicker">Session</span>
          <h2>Deconnexion manuelle</h2>
          <p className="support">Tu peux fermer proprement la session locale sans toucher aux parametres de ton compte TikTok.</p>
          <form action="/api/logout" method="post">
            <button className="btn btn-danger" type="submit">
              Se deconnecter
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
