import { test as setup } from "@playwright/test";
import { encode } from "next-auth/jwt";
import fs from "fs";
import path from "path";

// On http://localhost the Auth.js (v5) JWT session cookie is unprefixed.
const COOKIE_NAME = "authjs.session-token";
const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "e2e-test-secret-at-least-32-characters-xx";
const authFile = path.join("e2e", ".auth", "user.json");

// Mints a valid signed session cookie so authed specs skip the email flow.
setup("authenticate", async () => {
  const token = await encode({
    token: {
      id: "e2e-user",
      email: "e2e@reviewlens.test",
      name: "E2E User",
    },
    secret: AUTH_SECRET,
    salt: COOKIE_NAME,
    maxAge: 60 * 60,
  });

  const storageState = {
    cookies: [
      {
        name: COOKIE_NAME,
        value: token,
        domain: "localhost",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 3600,
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  };

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
});
