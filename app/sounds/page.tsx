<<<<<<< HEAD
﻿import Link from "next/link";
import soundsData from "@/data/sounds.json";
import { getSession } from "@/lib/session";
import { getUserSound } from "@/lib/supabaseAdmin";

type Sound = {
  id: string;
  title: string;
  artist?: string;
  tags?: string[];
  url?: string;
  creativeCenterUrl?: string;
};

type SearchParams = { q?: string; tag?: string; page?: string };
=======
﻿import { getOpenIdFromSession } from "@/lib/session";
import { getSounds } from "@/lib/sounds";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getMessage(err?: string) {
  if (err === "missing_sound") {
    return {
      title: "Selection incomplete",
      body: "Choisis un son valide dans la liste avant d’envoyer le formulaire.",
      tone: "error",
    };
  }

  if (err === "invalid_sound") {
    return {
      title: "Son invalide",
      body: "Le serveur a refuse cette selection, probablement parce qu’elle ne fait pas partie du catalogue.",
      tone: "error",
    };
  }

  return null;
}

export default async function SoundsPage({
  searchParams,
}: {
  searchParams?: Promise<{ err?: string }> | { err?: string };
}) {
  const openId = await getOpenIdFromSession();
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const message = getMessage(params.err);
  let selected: string | null = null;
>>>>>>> c9571fa (Polish UI and harden sound selection flow)

// -------- helpers --------
function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function pickTags(list: Sound[]) {
  const tags = list.flatMap((s) => s.tags ?? []);
  return uniq(tags).sort((a, b) => a.localeCompare(b, "fr"));
}

function buildHref(sp: { q?: string; tag?: string; page?: string }) {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.tag && sp.tag !== "Tous") params.set("tag", sp.tag);
  if (sp.page && sp.page !== "1") params.set("page", sp.page);
  const qs = params.toString();
  return qs ? `/sounds?${qs}` : "/sounds";
}

function contains(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

async function selectSound(soundId: string) {
  "use server";
  // POST vers ton API existante (/api/select-sound)
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/select-sound`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ soundId }),
    cache: "no-store",
  }).catch(() => {
    // en dev local, NEXT_PUBLIC_BASE_URL peut être vide → fetch relatif impossible côté server action
    // on gère via fallback plus bas (form action classique)
  });
}

// -------- page --------
export default async function SoundsPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  // ✅ Next 15: searchParams peut être async
  const sp = await Promise.resolve(searchParams ?? {});
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tag = typeof sp.tag === "string" ? sp.tag.trim() : "";
  const pageRaw = typeof sp.page === "string" ? sp.page : "1";
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);

  const session = await getSession();
  const openId = (session as any)?.open_id as string | undefined;
  const connected = Boolean(openId);

  // Son sélectionné (si connecté)
  let selectedSoundId: string | null = null;
  if (openId) {
    try {
      const picked = await getUserSound(openId);
      selectedSoundId = picked?.sound_id ?? null;
    } catch {
      selectedSoundId = null;
    }
  }

<<<<<<< HEAD
  const allSounds = (soundsData as unknown as Sound[]).map((s) => ({
    id: s.id,
    title: s.title ?? s.id,
    artist: s.artist,
    tags: s.tags ?? [],
    url: s.url,
    creativeCenterUrl: s.creativeCenterUrl,
  }));
=======
  const list = getSounds();
>>>>>>> c9571fa (Polish UI and harden sound selection flow)

  const tags = ["Tous", ...pickTags(allSounds)];

  // Filtrage
  let filtered = allSounds;

  if (tag && tag !== "Tous") {
    filtered = filtered.filter((s) => (s.tags ?? []).includes(tag));
  }

  if (q) {
    filtered = filtered.filter((s) => {
      const blob = `${s.title} ${s.id} ${(s.artist ?? "")} ${(s.tags ?? []).join(" ")}`;
      return contains(blob, q);
    });
  }

  // Pagination
  const PAGE_SIZE = 12;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  // UI
  return (
<<<<<<< HEAD
    <section className="stack">
      <div className="card hero">
        <div className="hero-top">
          <div>
            <h1>Catalogue (CML)</h1>
            <p className="p">
              Tu sélectionnes un son dans ta liste curée (pas de scraping). Le jeu récupère ton choix via ton{" "}
              <code>open_id</code>.
            </p>
          </div>

          <span className={`badge ${connected ? "badge-ok" : "badge-warn"}`}>
            {connected ? "Connecté" : "Non connecté"}
          </span>
        </div>

        <div className="actions">
          <Link className="btn btn-ghost" href="/">
            ← Accueil
          </Link>
          <Link className="btn" href="/me">
            Mon profil
          </Link>
          {!connected && (
            <a className="btn btn-primary" href="/api/auth/tiktok">
              Se connecter
            </a>
          )}
        </div>
      </div>

      {/* Search + tags */}
      <div className="card">
        <form className="searchbar" action="/sounds" method="get">
          <input
            className="input"
            name="q"
            placeholder="Rechercher un son (titre, tag, id)..."
            defaultValue={q}
          />
          <input type="hidden" name="tag" value={tag || "Tous"} />
          <button className="btn btn-primary" type="submit">
            Rechercher
          </button>
        </form>

        <div className="chips">
          {tags.map((t) => {
            const active = (tag || "Tous") === t;
            return (
              <Link
                key={t}
                className={`chip ${active ? "chip-on" : ""}`}
                href={buildHref({ q, tag: t, page: "1" })}
              >
                {t}
              </Link>
            );
          })}
        </div>

        <div className="meta">
          <span>
            {total} son(s) • page {safePage}/{totalPages}
          </span>
          {q || (tag && tag !== "Tous") ? (
            <Link className="u" href="/sounds">
              Réinitialiser
            </Link>
          ) : null}
        </div>
      </div>

      {!connected && (
        <div className="alert">
          <div>
            <strong>Astuce :</strong> connecte-toi pour enregistrer ton choix dans Supabase.
          </div>
          <a className="btn btn-sm btn-primary" href="/api/auth/tiktok">
            Se connecter
          </a>
        </div>
      )}

      {/* Grid */}
      <div className="grid">
        {pageItems.map((s) => {
          const isSelected = selectedSoundId === s.id;

          return (
            <div key={s.id} className={`card sound ${isSelected ? "sound-selected" : ""}`}>
              <div className="sound-top">
                <div>
                  <div className="sound-title">{s.title}</div>
                  <div className="sound-sub">
                    TikTok CML • <code>{s.id}</code>
                    {s.artist ? <span className="muted"> • {s.artist}</span> : null}
                  </div>
                </div>

                {isSelected ? <span className="pill">Sélectionné ✅</span> : null}
              </div>

              <div className="sound-tags">
                {(s.tags ?? []).slice(0, 5).map((t) => (
                  <Link key={t} className="tag" href={buildHref({ q: "", tag: t, page: "1" })}>
                    {t}
                  </Link>
                ))}
              </div>

              <div className="sound-actions">
                {s.creativeCenterUrl ? (
                  <a className="u" href={s.creativeCenterUrl} target="_blank" rel="noreferrer">
                    Ouvrir dans Creative Center
                  </a>
                ) : (
                  <span className="muted">Lien Creative Center non défini</span>
                )}

                {/* On garde un form classique vers /api/select-sound (fonctionne partout) */}
                <form action="/api/sounds/select" method="post">
                  <input type="hidden" name="sound_id" value={s.id} />
                  <button className="btn btn-primary" type="submit" disabled={!connected}>
                    Choisir
=======
    <main className="page-shell">
      <section className="page-header reveal">
        <div className="card page-header-main">
          <span className="eyebrow">Catalogue CML</span>
          <div className="stack">
            <h1>Choisis un son fiable pour ton passage en tete.</h1>
            <p className="lede">
              Chaque son de cette page est pre-valide dans ton catalogue interne. Tu peux donc
              selectionner rapidement un titre sans passer par un flux de moderation complique.
            </p>
          </div>
          <div className="hero-meta">
            <span className={`pill status-pill ${openId ? "ok" : "warn"}`}>
              {openId ? "Connexion active" : "Connexion requise pour enregistrer"}
            </span>
            <span className="pill">{list.length} sons disponibles</span>
          </div>
        </div>

        <aside className="card page-header-side">
          <span className="kicker">Comment ca marche</span>
          <div className="mini-list">
            <div className="mini-row">
              <span className="mini-badge">1</span>
              <div>
                <h3>Ouvre un titre</h3>
                <p>Chaque lien pointe vers le Creative Center pour verifier rapidement le contexte.</p>
              </div>
            </div>
            <div className="mini-row">
              <span className="mini-badge">2</span>
              <div>
                <h3>Selectionne</h3>
                <p>Le bouton enregistre ton choix dans Supabase et met a jour ton profil.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {message && (
        <div className={`notice ${message.tone === "error" ? "error" : ""} reveal reveal-delay-1`}>
          <div>
            <strong>{message.title}</strong>
            <p>{message.body}</p>
          </div>
        </div>
      )}

      {!openId && (
        <div className="notice reveal reveal-delay-1">
          <div>
            <strong>Tu n’es pas encore connecte.</strong>
            <p>Connecte-toi avec TikTok pour enregistrer un choix et l’afficher dans ton espace perso.</p>
          </div>
          <a className="btn btn-primary btn-sm" href="/api/auth/tiktok">Connexion TikTok</a>
        </div>
      )}

      <section className="sound-grid reveal reveal-delay-2">
        {list.map((s) => (
          <article key={s.id} className="card sound-card">
            <div className="sound-card-head">
              <div>
                <h2 className="sound-title">{s.title}</h2>
                <p className="sound-artist">{s.artist ?? "Artiste non renseigne"}</p>
              </div>
              {selected === s.id ? <span className="selected-mark">Actif</span> : null}
            </div>

            <div className="tag-row">
              {s.region ? <span className="tag">Region {s.region}</span> : null}
              {s.durationSec ? <span className="tag">{s.durationSec}s</span> : null}
              {s.tags?.map((tag) => (
                <span className="tag" key={tag}>{tag}</span>
              ))}
            </div>

            <div className="sound-actions">
              {s.cmlUrl ? (
                <a className="btn btn-secondary btn-sm" href={s.cmlUrl} target="_blank" rel="noreferrer">
                  Voir dans Creative Center
                </a>
              ) : (
                <span className="empty-note">Lien Creative Center non fourni</span>
              )}

              {openId ? (
                <form action="/api/select-sound" method="post">
                  <input type="hidden" name="sound_id" value={s.id} />
                  <button
                    className={`btn btn-sm ${selected === s.id ? "btn-primary" : "btn-ghost"}`}
                    type="submit"
                  >
                    {selected === s.id ? "Selection actuelle" : "Choisir ce son"}
>>>>>>> c9571fa (Polish UI and harden sound selection flow)
                  </button>
                </form>
              </div>

              {!connected ? <div className="muted tiny">Connecte-toi pour sélectionner.</div> : null}
            </div>
<<<<<<< HEAD
          );
        })}
      </div>

      {/* Pagination */}
      <div className="pager">
        <Link
          className={`btn btn-ghost ${safePage <= 1 ? "btn-disabled" : ""}`}
          href={buildHref({ q, tag: tag || "Tous", page: String(Math.max(1, safePage - 1)) })}
          aria-disabled={safePage <= 1}
        >
          ← Précédent
        </Link>

        <div className="muted">
          Page <strong>{safePage}</strong> / {totalPages}
        </div>

        <Link
          className={`btn btn-ghost ${safePage >= totalPages ? "btn-disabled" : ""}`}
          href={buildHref({ q, tag: tag || "Tous", page: String(Math.min(totalPages, safePage + 1)) })}
          aria-disabled={safePage >= totalPages}
        >
          Suivant →
        </Link>
      </div>

      <div className="muted center tiny" style={{ marginTop: 10 }}>
        MVP — sons issus d’une liste curée (TikTok Commercial Music Library).
      </div>
    </section>
=======
          </article>
        ))}
      </section>
    </main>
>>>>>>> c9571fa (Polish UI and harden sound selection flow)
  );
}

