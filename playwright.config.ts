import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/tests/e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3020", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev --workspace=@hnlms/web -- -p 3020",
    url: "http://localhost:3020",
    reuseExistingServer: true,
  },
});
