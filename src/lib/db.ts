import { type NeonQueryFunction, neon } from "@neondatabase/serverless";

let instance: NeonQueryFunction<false, false> | null = null;

export function sql() {
  if (instance) return instance;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required.");
  }

  instance = neon(url);
  return instance;
}
