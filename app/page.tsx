import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  const connected = Boolean((session as any)?.open_id || (session as any)?.openId);

  return (
    <section className="stack">
      <div className="card hero">
        <div className="hero-top">
          <div>
            <h1>Choisis ton son de leader 🥇</h1>
            <p className="p">
              Connecte ton TikTok, puis choisis un son (CML). Quand ta bille passe leader en live,
              le jeu peut déclencher le son associé.
            </p>
          </div>

          <span className={`badge ${connected ? "badge-ok" : "badge-warn"}`}>
            {connected ? "Connecté" : "Non connecté"}
          </span>
        </div>

        <div className="actions">
          <a className="btn btn-primary" href="/api/auth/tiktok">
            Continuer avec TikTok
          </a>
          <Link className="btn btn-ghost" href="/sounds">
            Voir la liste des sons
          </Link>
          <Link className="btn" href="/me">
            Mon profil
          </Link>
        </div>
      </div>

      {!connected && (
        <div className="alert">
          <div>
            <strong>Astuce :</strong> connecte-toi d’abord pour enregistrer ton choix dans Supabase.
          </div>
          <a className="btn btn-sm btn-primary" href="/api/auth/tiktok">Se connecter</a>
        </div>
      )}

      <div className="grid">
        <div className="card feature col4">
          <h2>Pourquoi la CML ?</h2>
          <p>La voie la plus “safe” sur TikTok : sons prévus pour usage commercial sur la plateforme.</p>
        </div>

        <div className="card feature col4">
          <h2>Stockage</h2>
          <p>Ton choix est enregistré sur le site (Supabase). Le jeu récupère le son via ton open_id.</p>
        </div>

        <div className="card feature col4">
          <h2>MVP</h2>
          <p>Catalogue curé (TikTok Commercial Music Library). Simple, rapide, fiable.</p>
        </div>
      </div>

      <div className="card feature">
        <h2>Besoin d’aide ?</h2>
        <p>
          Si “Continuer avec TikTok” te renvoie une erreur, c’est quasi toujours les variables d’environnement
          ou le redirect URL côté TikTok Developer.
        </p>
        <p style={{ marginTop: 10 }}>
          <Link className="u" href="/sounds">Ouvrir le catalogue</Link>
        </p>
      </div>
    </section>
  );
}
