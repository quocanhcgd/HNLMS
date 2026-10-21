import fs from "node:fs";
import path from "node:path";

/**
 * Load the workspace-level .env for local commands only.
 * Explicit process environment variables win, which keeps CI/deploy secrets authoritative.
 */
export function loadWorkspaceEnv(): void {
  if (process.env.NODE_ENV === "production") return;
  let directory = process.cwd();
  let envFile = path.join(directory, ".env");
  while (!fs.existsSync(envFile)) {
    const parent = path.dirname(directory);
    if (parent === directory) return;
    directory = parent;
    envFile = path.join(directory, ".env");
  }
  try {
    process.loadEnvFile(envFile);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

loadWorkspaceEnv();
