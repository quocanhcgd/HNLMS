import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "../../apps/api/src/database/schema/*.ts",
  out: "../../infra/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
