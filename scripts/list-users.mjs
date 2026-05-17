import { neon } from "@neondatabase/serverless";
import { loadEnv } from "./_load-env.mjs";

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in .env");
}

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  SELECT username, name, role, is_active, last_login_at, created_at
  FROM users
  ORDER BY created_at ASC
`;

console.table(rows);
