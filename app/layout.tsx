// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marble Live — Sound Picker",
  description: "Choisis un son CML pour ta bille leader (TikTok).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="topbar">
          <div className="container">
            <div className="topbar-inner">
              <Link href="/" className="brand">
                <span className="logo-dot" />
                <div>
                  <div className="brand-title">Marble Live</div>
                  <span className="brand-sub">Commercial Music Library only</span>
                </div>
              </Link>

              <nav className="nav">
                <Link href="/sounds">Sons</Link>
                <Link href="/me">Mon profil</Link>
              </nav>
            </div>
          </div>
        </header>

        <main>
          <div className="container">{children}</div>
        </main>
      </body>
    </html>
  );
}



