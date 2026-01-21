"use client";

import { useMemo, useState } from "react";

type Props = {
  initialUsername?: string | null;
};

export default function LinkLiveForm({ initialUsername }: Props) {
  const [username, setUsername] = useState(initialUsername ?? "");
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const cleaned = useMemo(() => username.trim(), [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOkMsg(null);
    setErrMsg(null);

    try {
      const res = await fetch("/api/live/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleaned }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrMsg(json?.error ?? "Erreur inconnue");
        if (json?.hint) setErrMsg(`${json.error} — ${json.hint}`);
        return;
      }

      setOkMsg(`✅ Live lié ! (provider_user_id=${json.provider_user_id})`);
      // refresh soft: pour que /me recharge le statut côté server
      window.location.reload();
    } catch (e: any) {
      setErrMsg(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="@ton_username"
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.25)",
          color: "white",
        }}
      />
      <button
        type="submit"
        disabled={loading || !cleaned}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.25)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "..." : "Lier"}
      </button>

      <div style={{ width: "100%", marginTop: 10 }}>
        {okMsg ? <div style={{ color: "#7CFFB2" }}>{okMsg}</div> : null}
        {errMsg ? <div style={{ color: "#FF7C7C" }}>❌ {errMsg}</div> : null}
      </div>
    </form>
  );
}