import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

// Fixed secret so the generated auth cookie (auth.setup.ts) matches what the
// dev server verifies. Overrides .env.local because real process.env takes
// precedence over .env files in Next.js.
const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "e2e-test-secret-at-least-32-characters-xx";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
      ]
    : "list",
  use: {
    baseURL,
    trace: isCI ? "retain-on-failure" : "on-first-retry",
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
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      AUTH_SECRET,
      AUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://ci:ci@localhost:5432/reviewlens_ci",
      DIRECT_URL:
        process.env.DIRECT_URL ??
        "postgresql://ci:ci@localhost:5432/reviewlens_ci",
      OPENAI_API_KEY:
        process.env.OPENAI_API_KEY ?? "sk-ci-placeholder-key-for-build-only",
    },
  },
});
