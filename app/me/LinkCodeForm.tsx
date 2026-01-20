"use client";

import { useState } from "react";

export default function LinkCodeForm() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    const r = await fetch("/api/link-code/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) setMsg(j?.error || "error");
    else setMsg("✅ Compte live lié ! Reviens sur le live et retape !join.");
  }

  return (
    <div className="card feature" style={{ marginTop: 16 }}>
      <h2>Lier ton compte Live</h2>
      <p>Entre le code affiché sur le live (valide 10 minutes).</p>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ex: A7K9QZ"
        />
        <button className="btn btn-primary" onClick={submit}>
          Lier
        </button>
      </div>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
