import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ err?: string }> | { err?: string };
}) {
  const session = await getSession();
  const connected = Boolean(session?.open_id);
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const showLoginError = params.err === "login";

  return (
    <section className="page-shell">
      <div className="card hero reveal">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Simple et rapide</span>
            <div className="stack">
              <h1>Connecte TikTok, choisis un son, c’est tout.</h1>
              <p className="lede">
                Le site sert a une seule chose : enregistrer le son utilise quand tu passes leader en live.
              </p>
            </div>

            <div className="hero-meta">
              <span className={`pill status-pill ${connected ? "ok" : "warn"}`}>
                {connected ? "TikTok connecte" : "Connexion requise"}
              </span>
              <span className="pill">Catalogue CML</span>
              <span className="pill">Choix enregistre</span>
            </div>

            <div className="actions">
              <a className="btn btn-primary" href="/api/auth/tiktok">
                {connected ? "Reconnecter TikTok" : "Continuer avec TikTok"}
              </a>
              <Link className="btn btn-secondary" href="/sounds">
                Voir les sons
              </Link>
              <Link className="btn btn-ghost" href="/me">
                Mon profil
              </Link>
            </div>
          </div>

          <aside className="hero-panel">
            <div>
              <span className="label">Parcours</span>
              <strong>3 etapes</strong>
            </div>
            <div className="mini-list">
              <div className="mini-row">
                <span className="mini-badge">1</span>
                <div>
                  <h3>Connexion</h3>
                  <p>Tu te connectes avec TikTok.</p>
                </div>
              </div>
              <div className="mini-row">
                <span className="mini-badge">2</span>
                <div>
                  <h3>Selection</h3>
                  <p>Tu choisis ton son dans la liste.</p>
                </div>
              </div>
              <div className="mini-row">
                <span className="mini-badge">3</span>
                <div>
                  <h3>C’est enregistre</h3>
                  <p>Ton choix est pret pour le live.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showLoginError && (
        <div className="notice error reveal reveal-delay-1">
          <div>
            <strong>Connexion requise</strong>
            <p>Connecte-toi avant d’enregistrer un son ou de generer un code de liaison.</p>
          </div>
          <a className="btn btn-primary btn-sm" href="/api/auth/tiktok">Se connecter</a>
        </div>
      )}

      {!connected && (
        <div className="notice reveal reveal-delay-1">
          <div>
            <strong>Commence par la connexion</strong>
            <p>Sans connexion TikTok, tu peux regarder la liste mais pas enregistrer ton choix.</p>
          </div>
          <a className="btn btn-secondary btn-sm" href="/api/auth/tiktok">Commencer</a>
        </div>
      )}

      <div className="stat-grid reveal reveal-delay-1">
        <div className="card stat-card col4">
          <span className="kicker">Etape 1</span>
          <div className="metric">Login</div>
          <p className="support">Connecte ton compte TikTok.</p>
        </div>

        <div className="card stat-card col4">
          <span className="kicker">Etape 2</span>
          <div className="metric">Choix</div>
          <p className="support">Selectionne un seul son pour ton profil.</p>
        </div>

        <div className="card stat-card col4">
          <span className="kicker">Etape 3</span>
          <div className="metric">Live</div>
          <p className="support">Le bridge peut recuperer ce choix ensuite.</p>
        </div>
      </div>

      <div className="card card-pad reveal reveal-delay-2">
        <div className="section-head">
          <div className="stack">
            <span className="eyebrow">Suite</span>
            <h2>Pret a choisir ton son ?</h2>
            <p className="support">Le catalogue contient seulement ce qu’il faut pour faire ton choix rapidement.</p>
          </div>
          <Link className="btn btn-primary" href="/sounds">
            Ouvrir le catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}
