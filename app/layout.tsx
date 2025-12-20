import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marble Live – Sound Picker",
  description: "Connect TikTok and pick a Commercial Music Library track."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-neutral-950 text-neutral-50 antialiased">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <header className="flex items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="text-xl">🏁</span>
              <span className="text-lg">Marble Live</span>
            </a>

            <nav className="flex items-center gap-4 text-sm text-neutral-300">
              <a className="hover:text-white" href="/sounds">Sons</a>
              <a className="hover:text-white" href="/me">Mon profil</a>
            </nav>
          </header>

          <div className="my-6 h-px w-full bg-neutral-800" />

          {children}

          <div className="mt-10 h-px w-full bg-neutral-800" />
          <footer className="mt-4 text-xs text-neutral-400">
            MVP – sons issus d’une liste curée (TikTok Commercial Music Library).
          </footer>
        </div>
      </body>
    </html>
  );
}
