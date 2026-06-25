import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Unit tests only — Playwright owns the e2e/ directory.
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "e2e/**"],
    // Satisfy lib/env validation so modules that import it can load.
    env: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/reviewlens",
      OPENAI_API_KEY: "sk-test-key",
      AUTH_SECRET: "test-secret-at-least-32-characters-long-xx",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
