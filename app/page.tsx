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
            <span className="eyebrow">TikTok Sound Workflow</span>
            <div className="stack">
              <h1>Associe un son de leader a ton profil live, proprement.</h1>
              <p className="lede">
                Marble Live connecte TikTok, ton catalogue CML et ton bridge de jeu dans une interface
                simple a expliquer, rapide a utiliser et assez solide pour un vrai lancement.
              </p>
            </div>

            <div className="hero-meta">
              <span className={`pill status-pill ${connected ? "ok" : "warn"}`}>
                {connected ? "Compte TikTok connecte" : "Connexion TikTok requise"}
              </span>
              <span className="pill">Catalogue CML valide manuellement</span>
              <span className="pill">Selection stockee dans Supabase</span>
            </div>

            <div className="actions">
              <a className="btn btn-primary" href="/api/auth/tiktok">
                {connected ? "Reconnecter TikTok" : "Continuer avec TikTok"}
              </a>
              <Link className="btn btn-secondary" href="/sounds">
                Ouvrir le catalogue
              </Link>
              <Link className="btn btn-ghost" href="/me">
                Voir mon espace
              </Link>
            </div>
          </div>

          <aside className="hero-panel">
            <div>
              <span className="label">Parcours ideal</span>
              <strong>3 etapes</strong>
            </div>
            <div className="mini-list">
              <div className="mini-row">
                <span className="mini-badge">1</span>
                <div>
                  <h3>Connexion</h3>
                  <p>Autorise TikTok et recupere ton identifiant `open_id` en session.</p>
                </div>
              </div>
              <div className="mini-row">
                <span className="mini-badge">2</span>
                <div>
                  <h3>Selection</h3>
                  <p>Choisis un son CML valide dans une liste maitrisee, sans scraping.</p>
                </div>
              </div>
              <div className="mini-row">
                <span className="mini-badge">3</span>
                <div>
                  <h3>Activation</h3>
                  <p>Le bridge live peut ensuite resoudre ton choix et jouer le bon son.</p>
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
            <strong>Astuce de lancement</strong>
            <p>Connecte ton compte d’abord pour enregistrer ton choix dans Supabase et afficher ton code live.</p>
          </div>
          <a className="btn btn-secondary btn-sm" href="/api/auth/tiktok">Commencer</a>
        </div>
      )}

      <div className="stat-grid reveal reveal-delay-1">
        <div className="card stat-card col4">
          <span className="kicker">Conformite</span>
          <div className="metric">CML</div>
          <p className="support">Une bibliotheque curatee pour rester dans un cadre plus propre cote TikTok.</p>
        </div>

        <div className="card stat-card col4">
          <span className="kicker">Stockage</span>
          <div className="metric">1 profil</div>
          <p className="support">Chaque choix de son est rattache a ton `open_id` et resolu par le bridge.</p>
        </div>

        <div className="card stat-card col4">
          <span className="kicker">Experience</span>
          <div className="metric">Rapide</div>
          <p className="support">Flux court, lisible et assez simple pour que tes users comprennent en quelques secondes.</p>
        </div>
      </div>

      <div className="grid reveal reveal-delay-2">
        <div className="card feature-card col4">
          <span className="kicker">Pourquoi ce produit</span>
          <h2>Un parcours clair pour un besoin tres specifique.</h2>
          <p className="support">Le site ne cherche pas a tout faire. Il connecte, valide, enregistre et expose exactement ce dont le live a besoin.</p>
        </div>

        <div className="card feature-card col4">
          <span className="kicker">Pour ton equipe</span>
          <h2>Moins d’operations manuelles.</h2>
          <p className="support">Le choix du son n’a plus besoin d’etre gere a la main dans un back-office ou par message prive.</p>
        </div>

        <div className="card feature-card col4">
          <span className="kicker">En cas de souci</span>
          <h2>Le point de friction est presque toujours la config OAuth.</h2>
          <p className="support">Si TikTok refuse la connexion, verifie les variables d’environnement et l’URL de redirection declaree.</p>
        </div>
      </div>

      <div className="card card-pad reveal reveal-delay-2">
        <div className="section-head">
          <div className="stack">
            <span className="eyebrow">Prochaine etape</span>
            <h2>Pret a choisir ton son ?</h2>
            <p className="support">Tu peux consulter le catalogue tout de suite, puis finaliser la liaison depuis ton espace perso.</p>
          </div>
          <Link className="btn btn-primary" href="/sounds">
            Explorer le catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}
