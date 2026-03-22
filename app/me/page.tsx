<<<<<<< HEAD
﻿// app/me/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import sounds from "@/data/sounds.json";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenIdFromSession } from "@/lib/session";
import LinkLiveForm from "./LinkLiveForm";
=======
﻿import crypto from "crypto";
import Link from "next/link";
import { getOpenIdFromSession } from "@/lib/session";
import { getSoundById } from "@/lib/sounds";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
>>>>>>> c9571fa (Polish UI and harden sound selection flow)

type Sound = { id: string; title: string; artist?: string | null };

export default async function MePage() {
  const openId = await getOpenIdFromSession();
  if (!openId) {
    return (
      <main className="page-shell">
        <section className="card page-header-main reveal">
          <span className="eyebrow">Espace personnel</span>
          <div className="stack">
            <h1>Ton profil sera disponible apres connexion.</h1>
            <p className="lede">
              Connecte ton compte TikTok pour afficher ton `open_id`, ta selection de son et ton code de liaison live.
            </p>
          </div>
          <div className="actions">
            <a className="btn btn-primary" href="/api/auth/tiktok">Continuer avec TikTok</a>
            <Link className="btn btn-secondary" href="/sounds">Voir les sons</Link>
          </div>
        </section>
      </main>
    );
  }

  const sb = supabaseAdmin();

<<<<<<< HEAD
  const [{ data: user }, { data: sel }, { data: liveLink }] = await Promise.all([
    (sb as any).from("users").select("display_name,avatar_url").eq("open_id", openId).maybeSingle(),
    (sb as any).from("user_sounds").select("sound_id,updated_at").eq("open_id", openId).maybeSingle(),
    (sb as any)
      .from("live_links")
      .select("provider,provider_user_id,open_id,username,updated_at,nickname,avatar_url")
      .eq("open_id", openId)
      .eq("provider", "tikfinity")
      .maybeSingle(),
  ]);

  const list = sounds as unknown as Sound[];
  const chosen = sel?.sound_id ? list.find((x) => x.id === sel.sound_id) ?? null : null;

  return (
    <main>
      <h1>Mon profil</h1>
      <p style={{ opacity: 0.8, fontSize: 13 }}>open_id: {openId.slice(0, 8)}…</p>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>Statut live</div>
        {liveLink?.provider_user_id ? (
          <div style={{ marginTop: 6 }}>
            ✅ Lié — <span style={{ opacity: 0.85 }}>@{liveLink.username}</span>{" "}
            <span style={{ opacity: 0.6, fontSize: 12 }}>({liveLink.provider_user_id})</span>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>updated_at: {String(liveLink.updated_at)}</div>
          </div>
        ) : (
          <div style={{ marginTop: 6, color: "#FF7C7C" }}>❌ Pas encore lié.</div>
        )}
      </div>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>Lier mon live (sans code)</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
          Entre ton @username TikTok (une seule fois). On va chercher ton ID TikFinity via les derniers events (join/like/chat),
          puis lier ton open_id à cet ID.
        </div>

        <div style={{ marginTop: 12 }}>
          <LinkLiveForm initialUsername={liveLink?.username ?? ""} />
=======
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET");
  }
  const linkCode = makeLinkCode(openId, secret);
  const chosen = sel?.sound_id ? getSoundById(sel.sound_id) : null;
  const displayName = user?.display_name ?? "TikTok creator";
  const avatarLetter = displayName.slice(0, 1).toUpperCase();

  return (
    <main className="page-shell">
      <section className="profile-grid reveal">
        <div className="card profile-card">
          <span className="eyebrow">Profil connecte</span>
          <div className="profile-head">
            {user?.avatar_url ? (
              <img className="avatar" src={user.avatar_url} alt={displayName} />
            ) : (
              <div className="avatar avatar-fallback">{avatarLetter}</div>
            )}
            <div>
              <h1>{displayName}</h1>
              <p>Ton espace centralise ton identifiant TikTok, ton son actif et ton code de liaison.</p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-tile">
              <span className="info-label">Identifiant</span>
              <span className="info-value">{openId.slice(0, 8)}...</span>
            </div>
            <div className="info-tile">
              <span className="info-label">Statut</span>
              <span className="info-value">Compte connecte</span>
            </div>
          </div>
>>>>>>> c9571fa (Polish UI and harden sound selection flow)
        </div>

<<<<<<< HEAD
      <div style={{ marginTop: 18, padding: 14, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>Son sélectionné</div>
        <div style={{ marginTop: 6 }}>
          {chosen ? (
            <span>
              {chosen.title} {chosen.artist ? <span style={{ opacity: 0.75 }}>— {chosen.artist}</span> : null}
            </span>
          ) : (
            <span style={{ opacity: 0.8 }}>Aucun pour l’instant.</span>
          )}
        </div>

        {sel?.sound_id ? (
          <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
            sound_id: {sel.sound_id} — updated_at: {String(sel.updated_at)}
          </div>
        ) : null}

        <div style={{ marginTop: 10 }}>
          <a href="/sounds">Changer mon son</a>
        </div>
      </div>
=======
        <aside className="card aside-card">
          <span className="kicker">Code de liaison live</span>
          <h2>Relie ton compte au bot en une commande.</h2>
          <div className="code-block">{linkCode}</div>
          <p className="helper">
            Dans le live, tape <code>!link {linkCode}</code> pour permettre au bridge d’associer ton profil.
          </p>
        </aside>
      </section>
>>>>>>> c9571fa (Polish UI and harden sound selection flow)

      <section className="grid reveal reveal-delay-1">
        <div className="card feature-card col4">
          <span className="kicker">Son actif</span>
          <h2>{chosen ? chosen.title : "Aucun son selectionne"}</h2>
          <p className="support">
            {chosen
              ? `${chosen.artist ? `${chosen.artist} · ` : ""}Ce son sera remonte au bridge pour les evenements live.`
              : "Choisis un titre dans le catalogue pour activer un son de leader sur ton profil."}
          </p>
          <Link className="btn btn-secondary" href="/sounds">
            {chosen ? "Changer mon son" : "Choisir un son"}
          </Link>
        </div>

        <div className="card feature-card col4">
          <span className="kicker">Compte TikTok</span>
          <h2>Session securisee</h2>
          <p className="support">Le site stocke une session signee et s’appuie sur TikTok OAuth pour identifier l’utilisateur connecte.</p>
        </div>

        <div className="card feature-card col4">
          <span className="kicker">Sortie</span>
          <h2>Deconnexion manuelle</h2>
          <p className="support">Tu peux fermer proprement la session locale sans toucher aux parametres de ton compte TikTok.</p>
          <form action="/api/logout" method="post">
            <button className="btn btn-danger" type="submit">
              Se deconnecter
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}