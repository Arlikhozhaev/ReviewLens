import { Prisma } from "@prisma/client";

function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  const message = String(error);
  return (
    message.includes("ENOTFOUND") ||
    message.includes("Can't reach database server") ||
    message.includes("tenant/user") ||
    message.includes("P1001")
  );
}

export function mapCreateAnalysisError(error: unknown): {
  message: string;
  status: number;
  code: string;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return {
        message: "Session expired. Please sign in again.",
        status: 401,
        code: "UNAUTHORIZED",
      };
    }
    if (error.code === "P2002") {
      return {
        message: "Could not allocate a unique share link. Please retry.",
        status: 409,
        code: "CONFLICT",
      };
    }
  }

  if (isDatabaseUnavailable(error)) {
    return {
      message:
        process.env.NODE_ENV === "development"
          ? "Database unavailable. Check DATABASE_URL / DIRECT_URL in .env.local and that your Supabase project is active."
          : "Service temporarily unavailable. Try again shortly.",
      status: 503,
      code: "DB_UNAVAILABLE",
    };
  }

  return {
    message: "Failed to create analysis session.",
    status: 500,
    code: "INTERNAL_ERROR",
  };
}
