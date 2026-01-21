"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = { initialUsername?: string };

type SuggestItem = {
  username: string;
  provider_user_id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  last_seen_at?: string | null;
  score?: number | null;
};

function normalize(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

export default function LinkLiveForm({ initialUsername = "" }: Props) {
  const [value, setValue] = useState(initialUsername);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const q = useMemo(() => normalize(value), [value]);

  // --- fetch suggestions (debounced) ---
  useEffect(() => {
    setMsg(null);
    setStatus("idle");

    if (!q || q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const t = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        const res = await fetch(`/api/live/suggest?q=${encodeURIComponent(q)}&limit=8`, {
          method: "GET",
          cache: "no-store",
          signal: ac.signal,
        });

        if (!res.ok) {
          setSuggestions([]);
          setOpen(false);
          setActiveIndex(-1);
          return;
        }

        const json = await res.json().catch(() => ({}));
        const items = Array.isArray(json.items) ? (json.items as SuggestItem[]) : [];

        setSuggestions(items);
        setOpen(items.length > 0);
        setActiveIndex(items.length > 0 ? 0 : -1);
      } catch {
        // ignore
      }
    }, 150);

    return () => clearTimeout(t);
  }, [q]);

  function pick(item: SuggestItem) {
    setValue(item.username);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    // remet le focus
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const username = normalize(value);
    if (!username) return;

    setLoading(true);
    setStatus("idle");
    setMsg(null);

    try {
      const res = await fetch("/api/live/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("err");
        setMsg(json?.hint || json?.details || json?.error || "Erreur");
        return;
      }

      setStatus("ok");
      setMsg("✅ Live lié !");
      setOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);

      // Important: pour que /me réaffiche immédiatement "Lié"
      // (si tu ne fais pas déjà refresh côté parent)
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        pick(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          ref={inputRef}
          placeholder="@ton_username"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
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
          disabled={loading || !normalize(value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "..." : "Lier"}
        </button>

        {status === "ok" ? <span style={{ color: "#8BFF8B" }}>✅</span> : null}
        {status === "err" ? <span style={{ color: "#FF7C7C" }}>❌</span> : null}
      </form>

      {msg ? (
        <div style={{ marginTop: 8, fontSize: 12, color: status === "err" ? "#FF7C7C" : "rgba(255,255,255,0.8)" }}>
          {msg}
        </div>
      ) : null}

      {open && suggestions.length > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(10,10,15,0.95)",
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {suggestions.map((s, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${s.username}-${s.provider_user_id}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // empêche blur avant click
                onClick={() => pick(s)}
                style={{
                  width: "100%",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  border: "none",
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  color: "white",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <img
                  src={s.avatar_url || "https://placehold.co/32x32"}
                  width={32}
                  height={32}
                  style={{ borderRadius: 999, objectFit: "cover" }}
                  alt=""
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>@{s.username}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {s.nickname ? s.nickname : "—"} • {s.provider_user_id}
                  </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.65 }}>
                  {typeof s.score === "number" ? `≈${s.score.toFixed(2)}` : ""}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}