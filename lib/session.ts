// lib/session.ts
import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "ml_session";

export type Session = {
  open_id: string;
};

function hmac(openId: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(openId).digest("hex");
}

function sign(openId: string, secret: string) {
  const sig = hmac(openId, secret);
  return `${openId}.${sig}`;
}

function splitSignedValue(v: string): { openId: string; sig: string } | null {
  // plus robuste que v.split(".") si jamais openId contient un "."
  const idx = v.lastIndexOf(".");
  if (idx <= 0) return null;

  const openId = v.slice(0, idx);
  const sig = v.slice(idx + 1);
  if (!openId || !sig) return null;

  return { openId, sig };
}

export async function setSession(openId: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const value = sign(openId, secret);

  const cookieStore = await cookies(); // ✅ Next 15: async
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
}

export async function clearSession() {
  const cookieStore = await cookies(); // ✅ Next 15
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getOpenIdFromSession(): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const cookieStore = await cookies(); // ✅ Next 15
  const v = cookieStore.get(COOKIE_NAME)?.value;
  if (!v) return null;

  const parts = splitSignedValue(v);
  if (!parts) return null;

  const { openId, sig } = parts;

  const expected = hmac(openId, secret);

  // timingSafeEqual exige même taille
  if (sig.length !== expected.length) return null;

  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  return ok ? openId : null;
}

/**
 * ✅ API "simple" utilisée par tes pages (HomePage, etc.)
 * Retourne un objet { open_id } ou null.
 */
export async function getSession(): Promise<Session | null> {
  const openId = await getOpenIdFromSession();
  return openId ? { open_id: openId } : null;
}



