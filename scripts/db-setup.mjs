import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { loadEnv } from "./_load-env.mjs";

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in .env");
}

const sql = neon(process.env.DATABASE_URL);
const migrationsDir = path.join(process.cwd(), "migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  const statements = content
    .split("\n-- statement-break\n")
    .map((statement) => statement.trim())
    .filter(Boolean);
  console.log(`Applying ${file}`);
  for (const statement of statements) {
    await sql(statement);
  }
}

console.log("Database setup complete.");
