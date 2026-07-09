import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { mapCreateAnalysisError } from "./create-analysis-errors";

describe("mapCreateAnalysisError", () => {
  it("maps database connection failures to DB_UNAVAILABLE", () => {
    const error = new Prisma.PrismaClientInitializationError(
      "tenant/user postgres.eccziupihegciupibxis not found",
      "5.0.0"
    );

    const mapped = mapCreateAnalysisError(error);

    expect(mapped.code).toBe("DB_UNAVAILABLE");
    expect(mapped.status).toBe(503);
    expect(mapped.message).toMatch(/Database unavailable|Service temporarily unavailable/);
  });

  it("maps foreign key violations to UNAUTHORIZED", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      { code: "P2003", clientVersion: "5.0.0" }
    );

    const mapped = mapCreateAnalysisError(error);

    expect(mapped.code).toBe("UNAUTHORIZED");
    expect(mapped.status).toBe(401);
  });
});
