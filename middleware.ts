import { auth } from "@/auth.edge";
import { NextResponse } from "next/server";

const PROTECTED_PAGE_PREFIXES = ["/analyze", "/sessions", "/compare", "/team"] as const;

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const requestId = crypto.randomUUID();

  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );

  if (isProtectedPage && !session) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-request-id", requestId);

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|api/inngest|api/health|api/auth|api/analysis/.+/status|api/analysis/.+/process).*)",
  ],
};
