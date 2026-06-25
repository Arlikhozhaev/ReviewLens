import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "@/lib/env";

// Edge-safe config shared with middleware. No providers or adapter here:
// the Email provider requires a database adapter (not available in the edge
// runtime), so it lives only in the full Node config (auth.ts). Middleware
// only needs to read the JWT session, which requires just the secret.
export default {
  providers: [],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  session: { strategy: "jwt" },
  secret: getAuthSecret(),
  trustHost: true,
} satisfies NextAuthConfig;
