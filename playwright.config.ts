import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/tests",
  timeout: 35_000,
  outputDir: "test-results",
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", testMatch: /e2e\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "visual-desktop", testMatch: /visual\/.*\.spec\.ts/, use: { viewport: { width: 1440, height: 900 } } },
    { name: "visual-mobile", testMatch: /visual\/.*\.spec\.ts/, use: { ...devices["Pixel 5"] } },
    { name: "accessibility", testMatch: /accessibility\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev --workspace=@hnlms/web -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
  },
});
