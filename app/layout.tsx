import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Marble Live | TikTok Sound Picker",
  description: "Connecte ton compte TikTok, choisis un son CML et relie ton profil au live en quelques secondes.",
  openGraph: {
    title: "Marble Live | TikTok Sound Picker",
    description: "Un sélecteur propre et rapide pour associer un son CML TikTok a ton profil Marble Live.",
    siteName: "Marble Live",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="site-shell">
          <header className="topbar">
            <div className="container topbar-inner">
              <Link className="brand" href="/">
                <span className="brand-mark">ML</span>
                <span className="brand-copy">
                  <span className="brand-title">Marble Live</span>
                  <span className="brand-subtitle">TikTok Commercial Music Library</span>
                </span>
              </Link>

              <nav className="nav">
                <Link href="/sounds">Sons</Link>
                <Link href="/me">Mon profil</Link>
                <a className="topbar-cta btn btn-secondary btn-sm" href="/api/auth/tiktok">
                  Connexion TikTok
                </a>
              </nav>
            </div>
          </header>

          <main className="container main">{children}</main>

          <footer className="footer">
            <div className="container footer-card">
              <span><strong>Marble Live</strong> simplifie la selection d’un son de leader depuis une liste CML curatee.</span>
              <span>OAuth TikTok, stockage Supabase, integration bridge.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
