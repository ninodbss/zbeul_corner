import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSounds } from "@/lib/sounds";
import { getUserSound } from "@/lib/supabaseAdmin";

type SearchParams = {
  q?: string;
  tag?: string;
  page?: string;
  err?: string;
};

function uniq(values: string[]) {
  return Array.from(new Set(values));
}

function buildHref(sp: SearchParams) {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.tag && sp.tag !== "Tous") params.set("tag", sp.tag);
  if (sp.page && sp.page !== "1") params.set("page", sp.page);
  if (sp.err) params.set("err", sp.err);
  const qs = params.toString();
  return qs ? `/sounds?${qs}` : "/sounds";
}

function contains(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function getMessage(err?: string) {
  if (err === "missing_sound") {
    return "Choisis un son avant d’envoyer le formulaire.";
  }

  if (err === "invalid_sound") {
    return "Le serveur a refuse cette selection car elle ne correspond pas au catalogue.";
  }

  return null;
}

export default async function SoundsPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tag = typeof sp.tag === "string" ? sp.tag.trim() : "";
  const pageRaw = typeof sp.page === "string" ? sp.page : "1";
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);
  const message = getMessage(typeof sp.err === "string" ? sp.err : undefined);

  const session = await getSession();
  const openId = session?.open_id ?? null;
  const connected = Boolean(openId);

  let selectedSoundId: string | null = null;
  if (openId) {
    try {
      const picked = await getUserSound(openId);
      selectedSoundId = picked?.sound_id ?? null;
    } catch {
      selectedSoundId = null;
    }
  }

  const allSounds = getSounds();
  const tags = ["Tous", ...uniq(allSounds.flatMap((sound) => sound.tags ?? [])).sort((a, b) => a.localeCompare(b, "fr"))];

  let filtered = allSounds;
  if (tag && tag !== "Tous") {
    filtered = filtered.filter((sound) => (sound.tags ?? []).includes(tag));
  }

  if (q) {
    filtered = filtered.filter((sound) => {
      const blob = `${sound.title} ${sound.id} ${sound.artist ?? ""} ${(sound.tags ?? []).join(" ")}`;
      return contains(blob, q);
    });
  }

  const pageSize = 12;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="page-shell">
      <div className="card hero reveal">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Catalogue CML</span>
            <div className="stack">
              <h1>Choisis ton son.</h1>
              <p className="lede">
                Recherche si besoin, puis valide un seul son pour ton profil.
              </p>
            </div>

            <div className="hero-meta">
              <span className={`pill status-pill ${connected ? "ok" : "warn"}`}>
                {connected ? "Tu peux enregistrer" : "Connexion requise"}
              </span>
              <span className="pill">{total} resultat(s)</span>
              <span className="pill">Page {safePage}/{totalPages}</span>
            </div>

            <div className="actions">
              <Link className="btn btn-secondary" href="/">
                Accueil
              </Link>
              <Link className="btn btn-ghost" href="/me">
                Mon profil
              </Link>
              {!connected ? (
                <a className="btn btn-primary" href="/api/auth/tiktok">
                  Connexion TikTok
                </a>
              ) : null}
            </div>
          </div>

          <aside className="hero-panel">
            <div>
              <span className="label">A faire</span>
              <strong>1 son</strong>
            </div>
            <div className="mini-list">
              <div className="mini-row">
                <span className="mini-badge">1</span>
                <div>
                  <h3>Trouve le bon titre</h3>
                  <p>Utilise la recherche ou les tags.</p>
                </div>
              </div>
              <div className="mini-row">
                <span className="mini-badge">2</span>
                <div>
                  <h3>Valide-le</h3>
                  <p>Ton dernier choix devient le son actif.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {message ? (
        <div className="notice error reveal reveal-delay-1">
          <div>
            <strong>Selection impossible</strong>
            <p>{message}</p>
          </div>
        </div>
      ) : null}

      {!connected ? (
        <div className="notice reveal reveal-delay-1">
          <div>
            <strong>Connexion requise pour enregistrer</strong>
            <p>Tu peux parcourir la liste maintenant et te connecter quand tu es pret.</p>
          </div>
          <a className="btn btn-primary btn-sm" href="/api/auth/tiktok">
            Se connecter
          </a>
        </div>
      ) : null}

      <div className="card card-pad reveal reveal-delay-1">
        <form className="sound-toolbar" action="/sounds" method="get">
          <input
            className="input"
            name="q"
            placeholder="Rechercher un son"
            defaultValue={q}
          />
          <input type="hidden" name="tag" value={tag || "Tous"} />
          <button className="btn btn-primary" type="submit">
            Rechercher
          </button>
          {(q || (tag && tag !== "Tous")) ? (
            <Link className="btn btn-ghost" href="/sounds">
              Reinitialiser
            </Link>
          ) : null}
        </form>

        <div className="chips">
          {tags.map((currentTag) => {
            const active = (tag || "Tous") === currentTag;
            return (
              <Link
                key={currentTag}
                className={`chip ${active ? "chip-on" : ""}`}
                href={buildHref({ q, tag: currentTag, page: "1" })}
              >
                {currentTag}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="sound-grid reveal reveal-delay-2">
        {pageItems.map((sound) => {
          const isSelected = selectedSoundId === sound.id;

          return (
            <article key={sound.id} className="card sound-card">
              <div className="sound-head">
                <div>
                  <div className="sound-title">{sound.title}</div>
                  <div className="sound-sub">
                    <code>{sound.id}</code>
                    {sound.artist ? <span className="muted"> · {sound.artist}</span> : null}
                  </div>
                </div>
                {isSelected ? <span className="pill status-pill ok">Selection actuelle</span> : null}
              </div>

              <div className="tag-row">
                {(sound.tags ?? []).map((soundTag) => (
                  <Link
                    key={`${sound.id}-${soundTag}`}
                    className="tag"
                    href={buildHref({ q, tag: soundTag, page: "1" })}
                  >
                    {soundTag}
                  </Link>
                ))}
              </div>

              <div className="sound-actions">
                {sound.creativeCenterUrl || sound.cmlUrl ? (
                  <a
                    className="btn btn-secondary btn-sm"
                    href={sound.creativeCenterUrl ?? sound.cmlUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir
                  </a>
                ) : null}

                {connected ? (
                  <form action="/api/select-sound" method="post">
                    <input type="hidden" name="sound_id" value={sound.id} />
                    <button className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-ghost"}`} type="submit">
                      {isSelected ? "Selection actuelle" : "Choisir ce son"}
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <div className="pagination reveal reveal-delay-2">
        <Link className={`btn btn-ghost ${safePage <= 1 ? "btn-disabled" : ""}`} href={buildHref({ q, tag, page: String(Math.max(1, safePage - 1)) })}>
          Precedent
        </Link>
        <Link
          className={`btn btn-ghost ${safePage >= totalPages ? "btn-disabled" : ""}`}
          href={buildHref({ q, tag, page: String(Math.min(totalPages, safePage + 1)) })}
        >
          Suivant
        </Link>
      </div>
    </section>
  );
}
