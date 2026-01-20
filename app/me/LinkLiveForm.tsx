"use client";

import { useState } from "react";

export default function LinkLiveForm({ alreadyLinked }: { alreadyLinked?: boolean }) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    try {
      const res = await fetch("/api/link-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMsg(json?.error || "Erreur inconnue");
        return;
      }

      setStatus("ok");
      setMsg("Compte live lié ✅ (tu peux fermer et revenir plus tard, c’est enregistré)");
      // petit refresh pour afficher le statut “lié” côté serveur
      window.location.reload();
    } catch (err: any) {
      setStatus("error");
      setMsg(err?.message || "Erreur réseau");
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="@monpseudo"
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #ccc",
          minWidth: 240,
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #333",
          cursor: "pointer",
          opacity: status === "loading" ? 0.6 : 1,
        }}
      >
        {alreadyLinked ? "Relier / mettre à jour" : "Lier mon compte live"}
      </button>

      <div style={{ width: "100%" }}>
        {status === "loading" ? (
          <div style={{ fontSize: 13, opacity: 0.8 }}>Liaison en cours…</div>
        ) : null}

        {status === "ok" ? (
          <div style={{ fontSize: 13, opacity: 0.9 }}>{msg}</div>
        ) : null}

        {status === "error" ? (
          <div style={{ fontSize: 13, color: "#b00020" }}>
            {msg === "no_recent_event_for_username"
              ? "Je ne t’ai pas trouvé dans les events. Tape !join dans le live puis réessaie."
              : msg}
          </div>
        ) : null}

        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7, lineHeight: 1.35 }}>
          Astuce : ton @username doit être exactement celui de TikTok (sans espace). Tu peux écrire avec ou sans “@”.
        </div>
      </div>
    </form>
  );
}