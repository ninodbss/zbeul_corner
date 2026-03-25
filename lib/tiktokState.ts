import crypto from "node:crypto";

const STATE_TTL_SECONDS = 60 * 10;

function getStateSecret() {
  return process.env.TIKTOK_STATE_SECRET || process.env.SESSION_SECRET;
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createTikTokState() {
  const secret = getStateSecret();
  if (!secret) {
    throw new Error("Missing TIKTOK_STATE_SECRET or SESSION_SECRET");
  }

  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(18).toString("base64url");
  const payload = `${issuedAt}.${nonce}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyTikTokState(state: string) {
  const secret = getStateSecret();
  if (!secret) {
    throw new Error("Missing TIKTOK_STATE_SECRET or SESSION_SECRET");
  }

  const parts = state.split(".");
  if (parts.length !== 3) {
    return { ok: false as const, reason: "malformed" };
  }

  const [issuedAtRaw, nonce, signature] = parts;
  if (!issuedAtRaw || !nonce || !signature) {
    return { ok: false as const, reason: "malformed" };
  }

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) {
    return { ok: false as const, reason: "invalid_timestamp" };
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSeconds < 0 || ageSeconds > STATE_TTL_SECONDS) {
    return { ok: false as const, reason: "expired" };
  }

  const payload = `${issuedAtRaw}.${nonce}`;
  const expected = sign(payload, secret);
  if (expected.length !== signature.length) {
    return { ok: false as const, reason: "bad_signature" };
  }

  const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) {
    return { ok: false as const, reason: "bad_signature" };
  }

  return { ok: true as const };
}
