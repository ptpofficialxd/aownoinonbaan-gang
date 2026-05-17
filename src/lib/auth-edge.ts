const SESSION_COOKIE = "aownoinonbaan_session";

export type Role = "member" | "admin";

export type SessionPayload = {
  sub: string;
  userId: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
};

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_REFRESH_THRESHOLD_SECONDS = 24 * 60 * 60;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 chars.");
  }
  return secret;
}

function b64urlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary);
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(value: string) {
  const pad = value.length % 4;
  const base64 =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    (pad ? "=".repeat(4 - pad) : "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(value: string) {
  if (value.length % 2 !== 0) {
    throw new Error("Invalid hex signature.");
  }
  const out = new Uint8Array(value.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(
  payload: Omit<SessionPayload, "iat" | "exp"> & { exp?: number },
) {
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = {
    sub: payload.sub,
    userId: payload.userId,
    name: payload.name,
    role: payload.role,
    iat: now,
    exp: payload.exp ?? now + SESSION_TTL_SECONDS,
  };
  const encodedPayload = b64urlEncode(JSON.stringify(full));
  const key = await importKey(getAuthSecret());
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload),
  );
  return `${encodedPayload}.${bytesToHex(new Uint8Array(signature))}`;
}

export async function verifySession(token: string | null | undefined) {
  if (!token) return null;
  const dotIndex = token.indexOf(".");
  if (dotIndex <= 0) return null;

  const encodedPayload = token.slice(0, dotIndex);
  const providedHex = token.slice(dotIndex + 1);

  let expected: Uint8Array;
  let provided: Uint8Array;
  try {
    const key = await importKey(getAuthSecret());
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(encodedPayload),
    );
    expected = new Uint8Array(signature);
    provided = hexToBytes(providedHex);
  } catch {
    return null;
  }

  if (!constantTimeEqual(expected, provided)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(b64urlDecode(encodedPayload)) as SessionPayload;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) {
    return null;
  }

  payload.role = payload.role === "admin" ? "admin" : "member";
  return payload;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
