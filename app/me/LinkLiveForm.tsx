"use client";

import React from "react";

type Props = {
  initialUsername?: string;
};

type SuggestItem = {
  provider_user_id: string;
  username: string;
  nickname?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

function normalizeUsername(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function Avatar({ url, alt }: { url?: string | null; alt: string }) {
  const [src, setSrc] = React.useState<string | null>(url ?? null);

  React.useEffect(() => {
    setSrc(url ?? null);
  }, [url]);

  if (!src) {
    return (
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.8)",
          flex: "0 0 auto",
        }}
        aria-hidden
      >
        {(alt?.[0] ?? "?").toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={26}
      height={26}
      style={{
        width: 26,
        height: 26,
        borderRadius: 999,
        objectFit: "cover",
        background: "rgba(255,255,255,0.08)",
        flex: "0 0 auto",
      }}
      referrerPolicy="no-referrer"
      onError={() => setSrc(null)}
    />
  );
}

export default function LinkLiveForm({ initialUsername = "" }: Props) {
  const [username, setUsername] = React.useState(initialUsername);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<SuggestItem[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const normalized = normalizeUsername(username);
  const debounced = useDebounced(normalized, 180);

  // Close dropdown on outside click
  React.useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // Fetch suggestions
  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debounced || debounced.length < 1) {
        setItems([]);
        setActiveIndex(-1);
        return;
      }

      try {
        const res = await fetch(`/api/live/suggest?q=${encodeURIComponent(debounced)}&limit=8`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setItems([]);
            setActiveIndex(-1);
          }
          return;
        }

        const json = await res.json();
        const list = Array.isArray(json?.items) ? (json.items as SuggestItem[]) : [];

        if (!cancelled) {
          setItems(list);
          setActiveIndex(list.length ? 0 : -1);
          setOpen(true);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setActiveIndex(-1);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  function pick(item: SuggestItem) {
    setUsername(item.username);
    setMsg(null);
    setOpen(false);
    setItems((prev) => prev); // noop
    setActiveIndex(-1);
    // refocus
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function doLink() {
    setMsg(null);

    const u = normalizeUsername(username);
    if (!u) {
      setMsg("❌ Entre un @username.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/live/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: u }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const hint = json?.hint ? ` — ${json.hint}` : "";
        setMsg(`❌ ${json?.error ?? "error"}${hint}`);
        return;
      }

      setMsg("✅ Lié ! Recharge /me si besoin.");
      // petit refresh client (sans router import)
      setTimeout(() => {
        window.location.reload();
      }, 250);
    } catch (e: any) {
      setMsg(`❌ réseau: ${String(e?.message ?? e)}`);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      // si dropdown ouvert, Enter prend la suggestion active (sinon ça link)
      if (activeIndex >= 0 && activeIndex < items.length) {
        e.preventDefault();
        pick(items[activeIndex]);
      }
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doLink();
        }}
        style={{ display: "flex", gap: 10, alignItems: "center" }}
      >
        <input
          ref={inputRef}
          placeholder="@ton_username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setMsg(null);
            setOpen(true);
          }}
          onFocus={() => {
            if (items.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            outline: "none",
          }}
          autoComplete="off"
          spellCheck={false}
        />

        <button
          type="submit"
          disabled={loading || !normalizeUsername(username)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "..." : "Lier"}
        </button>
      </form>

      {msg ? (
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9, whiteSpace: "pre-wrap" }}>{msg}</div>
      ) : null}

      {/* Dropdown */}
      {open && items.length > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            marginTop: 8,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(20,20,24,0.92)",
            backdropFilter: "blur(8px)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {items.map((it, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={`${it.provider_user_id}-${it.username}-${idx}`}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => e.preventDefault()} // évite de perdre le focus avant click
                onClick={() => pick(it)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "none",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <Avatar url={it.avatar_url} alt={it.username} />

                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, lineHeight: "18px" }}>
                    @{it.username}
                  </div>
                  <div style={{ opacity: 0.75, fontSize: 12, lineHeight: "16px" }}>
                    {it.nickname ? (
                      <>
                        {it.nickname} <span style={{ opacity: 0.55 }}>•</span>{" "}
                      </>
                    ) : null}
                    <span style={{ opacity: 0.7 }}>{it.provider_user_id}</span>
                  </div>
                </div>

                {/* petit “score” / recency optionnel */}
                <div style={{ opacity: 0.5, fontSize: 12, flex: "0 0 auto" }}>
                  {it.created_at ? "" : ""}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}