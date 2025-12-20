import sounds from "@/data/sounds.json";
import { getOpenIdFromSession } from "@/lib/session";
import { getSelectedSound } from "@/lib/supabaseAdmin";

type Sound = {
  id: string;
  title: string;
  artist?: string;
  url: string;
  region?: string;
};

export default async function SoundsPage() {
  const openId = getOpenIdFromSession();
  const selected = openId ? await getSelectedSound(openId) : null;
  const list = sounds as Sound[];

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalogue (CML)</h1>
          <p className="mt-2 text-sm text-neutral-300">
            Tu sélectionnes un son dans ta liste curée (pas de scraping).
          </p>
        </div>

        <a
          href="https://ads.tiktok.com/business/creativecenter/music"
          target="_blank"
          className="text-sm text-neutral-300 hover:text-white"
        >
          Creative Center ↗
        </a>
      </div>

      {!openId ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <span className="font-medium">Tu n’es pas connecté.</span>{" "}
          <a className="underline hover:no-underline" href="/api/auth/tiktok">
            Connecte-toi avec TikTok
          </a>{" "}
          pour enregistrer ton choix.
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <span className="font-medium">Connecté ✅</span>{" "}
          {selected ? (
            <span className="text-neutral-200">
              Ton choix actuel : <span className="font-semibold">{selected.title}</span>
            </span>
          ) : (
            <span className="text-neutral-200">Aucun son choisi pour l’instant.</span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((s) => (
          <div key={s.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
            <div className="flex items-start justify-between gap-3">
Copy-Item .\app\sounds\page.tsx .\app\sounds\page.tsx.bak -ErrorAction SilentlyContinue

@'
import sounds from "@/data/sounds.json";
import { getOpenIdFromSession } from "@/lib/session";
import { getSelectedSound } from "@/lib/supabaseAdmin";

type Sound = {
  id: string;
  title: string;
  artist?: string;
  url: string;
  region?: string;
};

export default async function SoundsPage() {
  const openId = getOpenIdFromSession();
  const selected = openId ? await getSelectedSound(openId) : null;
  const list = sounds as Sound[];

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalogue (CML)</h1>
          <p className="mt-2 text-sm text-neutral-300">
            Tu sélectionnes un son dans ta liste curée (pas de scraping).
          </p>
        </div>

        <a
          href="https://ads.tiktok.com/business/creativecenter/music"
          target="_blank"
          className="text-sm text-neutral-300 hover:text-white"
        >
          Creative Center ↗
        </a>
      </div>

      {!openId ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <span className="font-medium">Tu n’es pas connecté.</span>{" "}
          <a className="underline hover:no-underline" href="/api/auth/tiktok">
            Connecte-toi avec TikTok
          </a>{" "}
          pour enregistrer ton choix.
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <span className="font-medium">Connecté ✅</span>{" "}
          {selected ? (
            <span className="text-neutral-200">
              Ton choix actuel : <span className="font-semibold">{selected.title}</span>
            </span>
          ) : (
            <span className="text-neutral-200">Aucun son choisi pour l’instant.</span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((s) => (
          <div key={s.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold leading-tight">{s.title}</div>
                <div className="mt-1 text-sm text-neutral-400">{s.artist ?? "TikTok CML"}</div>
              </div>

              {selected?.id === s.id ? (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                  Sélectionné
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={s.url}
                target="_blank"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-sm hover:bg-neutral-900"
              >
                Ouvrir
              </a>

              {openId ? (
                <form action="/api/select-sound" method="post" className="flex-1">
                  <input type="hidden" name="sound_id" value={s.id} />
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
                  >
                    Choisir
                  </button>
                </form>
              ) : (
                <a
                  href="/api/auth/tiktok"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
                >
                  Se connecter
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
