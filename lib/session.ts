import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "tt_session";

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function setSession(openId: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");
  const sig = sign(openId, secret);
  const value = `${openId}.${sig}`;
  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSession() {
  cookies().set(COOKIE_NAME, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function getOpenIdFromSession(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const v = cookies().get(COOKIE_NAME)?.value;
  if (!v) return null;

  const [openId, sig] = v.split(".");
  if (!openId || !sig) return null;

  const expected = sign(openId, secret);
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok ? openId : null;
}
