import "./load-env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase, databaseConfigFromEnv } from "./client";
import fs from "node:fs";
import path from "node:path";

function migrationsFolder(): string {
  const configured = process.env.MIGRATIONS_FOLDER?.trim();
  if (configured) return path.resolve(process.cwd(), configured);
  let directory = process.cwd();
  while (true) {
    const candidate = path.join(directory, "infra", "migrations");
    if (fs.existsSync(path.join(candidate, "meta", "_journal.json"))) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error("migrations_folder_not_found");
    directory = parent;
  }
}

export async function runMigrations() {
  const { db, pool } = createDatabase(databaseConfigFromEnv());
  try {
    await migrate(db, { migrationsFolder: migrationsFolder() });
  } finally {
    await pool.end();
  }
}

if (process.argv.includes("--run")) void runMigrations();
