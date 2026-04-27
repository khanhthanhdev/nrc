import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.test" });

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:3001";
const API_URL =
  process.env.PLAYWRIGHT_API_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const DATABASE_URL = process.env.DATABASE_URL ?? "";

const resolveDatabaseName = (databaseUrl: string): string => {
  try {
    const parsed = new URL(databaseUrl);
    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
};

const DATABASE_NAME = resolveDatabaseName(DATABASE_URL);

if (!/(test|e2e)/i.test(DATABASE_NAME)) {
  throw new Error(
    `Refusing to run Playwright E2E with unsafe DATABASE_URL (${DATABASE_NAME || "unknown"}). ` +
      "Use a dedicated test database name containing 'test' or 'e2e'.",
  );
}

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  globalTeardown: "./apps/web/e2e/global-teardown.ts",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "./apps/web/e2e",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "ENABLE_E2E_TEST_HELPERS=1 turbo run dev --filter=server --filter=web",
    env: {
      ...process.env,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? API_URL,
      CORS_ORIGIN: process.env.CORS_ORIGIN ?? BASE_URL,
      ENABLE_E2E_TEST_HELPERS: "1",
      NODE_ENV: process.env.NODE_ENV ?? "test",
      PLAYWRIGHT_API_URL: API_URL,
      PLAYWRIGHT_BASE_URL: BASE_URL,
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: BASE_URL,
  },
  workers: 1,
});
