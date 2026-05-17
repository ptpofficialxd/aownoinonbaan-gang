import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { neon } from "@neondatabase/serverless";
import { hash } from "@node-rs/argon2";
import { loadEnv } from "./_load-env.mjs";

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in .env");
}

const sql = neon(process.env.DATABASE_URL);
const rl = readline.createInterface({ input, output });

const username = (await rl.question("Username: ")).trim().toLowerCase();
const name = (await rl.question("Name: ")).trim();
const roleInput = (await rl.question("Role (member/admin) [member]: ")).trim();
const password = await rl.question("Password: ");
await rl.close();

if (!username) {
  throw new Error("Username is required.");
}

const role = roleInput === "admin" ? "admin" : "member";
const passwordHash = await hash(password.normalize("NFKC"), {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
});

await sql`
  INSERT INTO users (username, name, role, password_hash)
  VALUES (${username}, ${name}, ${role}, ${passwordHash})
  ON CONFLICT ((lower(username)))
  DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash,
    is_active = true
`;

console.log(`Saved ${username} as ${role}.`);
