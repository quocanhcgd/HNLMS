import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export type DatabaseConfig = { url: string; maxConnections?: number };
export function createDatabase(config: DatabaseConfig) {
  const pool = new Pool({
    connectionString: config.url,
    max: config.maxConnections ?? 10,
    application_name: "hnlms-api",
  });
  return { db: drizzle(pool), pool };
}
export function databaseConfigFromEnv(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const url = env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return { url, maxConnections: Number(env.DATABASE_POOL_MAX ?? 10) };
}
