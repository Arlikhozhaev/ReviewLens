import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function requireAuthUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return { session, userId };
}

export function unauthorizedResponse<T>(): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: false as const,
      error: "Sign in required",
      code: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
