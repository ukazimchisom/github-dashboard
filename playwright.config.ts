import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Where our test files live
  testDir: "./e2e",

  // Run tests in parallel for speed
  fullyParallel: true,

  // Fail the build if you accidentally left test.only in a file
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI (network flakiness)
  retries: process.env.CI ? 1 : 0,

  // Use 1 worker locally (avoids port conflicts)
  workers: process.env.CI ? 2 : 1,

  // HTML report saved to playwright-report/
  reporter: "html",

  use: {
    // Base URL so we can write page.goto('/login') instead of full URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",

    // Save a trace on first retry — helps debug CI failures
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start the Next.js dev server automatically before tests run
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // 2 minutes to start
  },
});
