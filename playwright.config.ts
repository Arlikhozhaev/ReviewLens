import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

// Fixed secret so the generated auth cookie (auth.setup.ts) matches what the
// dev server verifies. Overrides .env.local because real process.env takes
// precedence over .env files in Next.js.
const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "e2e-test-secret-at-least-32-characters-xx";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "golden",
      testMatch: /golden-path\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
    },
    {
      name: "public",
      testMatch: /auth-redirect\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_SECRET,
      AUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
    },
  },
});
