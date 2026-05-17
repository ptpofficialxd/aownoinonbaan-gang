import { hash } from "@node-rs/argon2";

const value = process.argv[2];

if (!value) {
  throw new Error("Usage: bun scripts/hash-password.mjs <password>");
}

const passwordHash = await hash(value.normalize("NFKC"), {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
});

console.log(passwordHash);
