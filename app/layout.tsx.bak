import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marble Live – Sound Picker",
  description: "Connect TikTok and pick a Commercial Music Library track for your marble."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", margin: 0 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <h2 style={{ margin: 0 }}>🏁 Marble Live</h2>
            </a>
            <nav style={{ display: "flex", gap: 12 }}>
              <a href="/sounds">Sons</a>
              <a href="/me">Mon profil</a>
            </nav>
          </header>
          <hr style={{ margin: "16px 0" }} />
          {children}
          <hr style={{ margin: "24px 0 12px" }} />
          <footer style={{ fontSize: 12, opacity: 0.75 }}>
            MVP – sons provenant d’une liste que tu as curée à partir de la TikTok Commercial Music Library.
          </footer>
        </div>
      </body>
    </html>
  );
}
