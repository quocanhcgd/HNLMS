import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase, databaseConfigFromEnv } from "./client";

export async function runMigrations() {
  const { db, pool } = createDatabase(databaseConfigFromEnv());
  try {
    await migrate(db, { migrationsFolder: process.env.MIGRATIONS_FOLDER ?? "infra/migrations" });
  } finally {
    await pool.end();
  }
}

if (process.argv.includes("--run")) void runMigrations();
