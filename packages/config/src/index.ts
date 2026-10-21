export type ServerEnv = {
  nodeEnv: "development" | "test" | "production";
  apiPort: number;
  webOrigin: string;
  databaseUrl?: string;
  redisUrl?: string;
  sessionSecret?: string;
};

export type PublicWebEnv = { siteUrl: string };

export class EnvironmentConfigError extends Error {
  constructor(public readonly key: string, message: string) { super(message); this.name = "EnvironmentConfigError"; }
}

function numberEnv(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const value = env[key] ?? String(fallback); const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) throw new EnvironmentConfigError(key, `${key}_must_be_port`);
  return parsed;
}

function urlEnv(env: NodeJS.ProcessEnv, key: string, fallback: string): string {
  const value = (env[key] ?? fallback).trim();
  try { new URL(value); } catch { throw new EnvironmentConfigError(key, `${key}_must_be_url`); }
  return value;
}

export function readServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const nodeEnv = (env.NODE_ENV ?? "development") as ServerEnv["nodeEnv"];
  if (!["development", "test", "production"].includes(nodeEnv)) throw new EnvironmentConfigError("NODE_ENV", "NODE_ENV_invalid");
  const sessionSecret = env.SESSION_SECRET?.trim();
  if (nodeEnv === "production" && (!sessionSecret || sessionSecret.length < 32)) throw new EnvironmentConfigError("SESSION_SECRET", "SESSION_SECRET_must_be_32_chars_in_production");
  return { nodeEnv, apiPort: numberEnv(env, "API_PORT", 4000), webOrigin: urlEnv(env, "WEB_ORIGIN", "http://localhost:3100"), databaseUrl: env.DATABASE_URL?.trim() || undefined, redisUrl: env.REDIS_URL?.trim() || undefined, sessionSecret: sessionSecret || undefined };
}

export function readPublicWebEnv(env: NodeJS.ProcessEnv = process.env): PublicWebEnv {
  return { siteUrl: urlEnv(env, "NEXT_PUBLIC_SITE_URL", "https://hanoilearning.vn") };
}
