"use client";

import { useState } from "react";

export default function LinkCodeForm() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/live/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur");

      setMsg(
        `✅ Live lié ! provider_user_id=${json.provider_user_id} (vu dans les events ${json.event_type})`
      );
    } catch (err: any) {
      setMsg(`❌ ${err?.message || "Erreur"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 18, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
      <div style={{ fontWeight: 800 }}>Lier mon live (sans code)</div>
      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
        Entre ton <b>@username TikTok</b> (une seule fois). On va chercher ton ID Tikfinity via les derniers events (join/like),
        puis on lie ton <code>open_id</code> à cet ID.
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@flamelover_johann"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #ccc" }}
        />
        <button
          disabled={loading}
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "..." : "Lier"}
        </button>
      </form>

      {msg ? <div style={{ marginTop: 10, fontSize: 13 }}>{msg}</div> : null}
    </div>
  );
}
