import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "ml_session";

function sign(openId: string, secret: string) {
  const sig = crypto.createHmac("sha256", secret).update(openId).digest("hex");
  return `${openId}.${sig}`;
}

export async function setSession(openId: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const value = sign(openId, secret);

  const cookieStore = await cookies(); // ✅ Next 15
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const cookieStore = await cookies(); // ✅ Next 15
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function getOpenIdFromSession(): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const cookieStore = await cookies(); // ✅ Next 15
  const v = cookieStore.get(COOKIE_NAME)?.value;
  if (!v) return null;

  const [openId, sig] = v.split(".");
  if (!openId || !sig) return null;

  const expected = crypto.createHmac("sha256", secret).update(openId).digest("hex");
  if (sig.length !== expected.length) return null;

  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  return ok ? openId : null;
}
