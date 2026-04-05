import "dotenv/config";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Client } from "pg";

function parseArgs(argv) {
  const args = {};

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    if (!key || !value) continue;
    args[key] = value;
  }

  return args;
}

async function main() {
  const { email, password, name = "Admin" } = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!email || !password) {
    throw new Error("Usage: node scripts/seed-admin.mjs --email=... --password=... [--name=...]");
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    await client.query(
      `
        INSERT INTO "User" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 'admin', NOW(), NOW())
        ON CONFLICT ("email") DO UPDATE SET
          "name" = EXCLUDED."name",
          "password" = EXCLUDED."password",
          "role" = 'admin',
          "updatedAt" = NOW()
      `,
      [randomUUID(), email, name, hashedPassword],
    );

    console.log(`Admin ready for ${email}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
