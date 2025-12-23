import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables for test database
dotenv.config({ path: ".env.test" });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel - disabled for early access tests */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "list",

  /* Global setup and teardown */
  globalSetup: "./tests/setup/database.ts",
  globalTeardown: "./tests/setup/teardown.ts",

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3001",
    headless: true,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Webkit/Safari - commented out due to macOS compatibility issues
    // Uncomment if you need Safari testing and it works on your system
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // Mobile Safari - commented out due to WebKit issues
    // Uncomment if WebKit works on your system
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npm run build && cross-env PORT=3001 DATABASE_URL=${process.env.DATABASE_URL_TEST || "postgresql://postgres:example@localhost:5436/postgres"} DATABASE_URL_TEST=${process.env.DATABASE_URL_TEST || "postgresql://postgres:example@localhost:5436/postgres"} IS_TEST=true vite dev`,
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      IS_TEST: "true",
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ||
        "postgresql://postgres:example@localhost:5436/postgres",
      DATABASE_URL_TEST:
        process.env.DATABASE_URL_TEST ||
        "postgresql://postgres:example@localhost:5436/postgres",
    },
  },
});
