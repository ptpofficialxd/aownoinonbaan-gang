import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import type { Role } from "./auth-edge";
import { sql } from "./db";

const ARGON2_ID = 2;

const ARGON2_OPTIONS = {
  algorithm: ARGON2_ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  is_active: boolean;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  isActive: boolean;
};

let dummyHashPromise: Promise<string> | null = null;

function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = argonHash("dummy-password-value", ARGON2_OPTIONS);
  }
  return dummyHashPromise;
}

export async function hashPassword(password: string) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  return argonHash(password.normalize("NFKC"), ARGON2_OPTIONS);
}

export async function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith("$argon2")) {
    return false;
  }
  try {
    return await argonVerify(stored, password.normalize("NFKC"));
  } catch {
    return false;
  }
}

export async function verifyCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const rows = (await sql()`
    SELECT id, email, name, role, password_hash, is_active
    FROM users
    WHERE lower(email) = ${normalizedEmail}
    LIMIT 1
  `) as UserRow[];

  const row = rows[0];
  const targetHash = row?.password_hash ?? (await getDummyHash());
  const ok = await verifyPassword(password, targetHash);

  if (!ok || !row || !row.is_active) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.password_hash,
    isActive: row.is_active,
  } satisfies User;
}

export async function updateLastLogin(userId: string) {
  await sql()`
    UPDATE users
    SET last_login_at = now()
    WHERE id = ${userId}
  `;
}
