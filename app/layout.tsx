import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Marble Live — Sound Picker",
  description: "Choisis ton son de leader (TikTok CML).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="topbar">
          <div className="container topbar-inner">
            <Link className="brand" href="/">
              <span className="brand-dot" />
              <span>Marble Live</span>
              <span className="badge-mini">Commercial Music Library</span>
            </Link>

            <nav className="nav">
              <Link href="/sounds">Sons</Link>
              <Link href="/me">Mon profil</Link>
            </nav>
          </div>
        </header>

        <main className="container main">{children}</main>

        <footer className="footer">
          MVP — sons issus d’une liste curée (TikTok Commercial Music Library).
        </footer>
      </body>
    </html>
  );
}
