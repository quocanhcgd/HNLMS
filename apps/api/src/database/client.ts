import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export type DatabaseConfig = { url: string; maxConnections?: number };
function validateDatabaseConfig(config: DatabaseConfig) {
  if (!/^postgres(?:ql)?:\/\//.test(config.url)) throw new Error("DATABASE_URL_must_be_postgres");
  if (config.maxConnections !== undefined && (!Number.isInteger(config.maxConnections) || config.maxConnections < 1 || config.maxConnections > 100)) throw new Error("DATABASE_POOL_MAX_invalid");
}
export function createDatabase(config: DatabaseConfig) {
  validateDatabaseConfig(config);
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
  const config = { url, maxConnections: Number(env.DATABASE_POOL_MAX ?? 10) };
  validateDatabaseConfig(config);
  return config;
}

/** All multi-write use cases must call this helper so commit/rollback is explicit. */
export function withTransaction<T>(db: { transaction: (callback: (tx: unknown) => Promise<T>) => Promise<T> }, operation: (tx: unknown) => Promise<T>) {
  return db.transaction(operation);
}
