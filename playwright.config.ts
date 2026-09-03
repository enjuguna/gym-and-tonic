import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:4322", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: "node e2e/server.mjs", url: "http://127.0.0.1:4322", reuseExistingServer: false, timeout: 30_000 },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "firefox", testMatch: /.*smoke\.spec\.ts/, use: { ...devices["Desktop Firefox"] } },
  ],
});
