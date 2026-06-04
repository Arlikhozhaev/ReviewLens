import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeRequestSchema } from "@/lib/validations/review";
import { generateShareableSlug } from "@/lib/utils";
import type { ApiResponse } from "@/types";

// Export the response type — client components import this for type safety
export interface CreateAnalysisResponse {
  sessionId: string;
  shareableSlug: string;
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<CreateAnalysisResponse>>> {
  try {
    const body: unknown = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {  
        if (process.env.NODE_ENV === "development") {
            console.error(
                "[POST /api/analysis] Validation failed:",
                JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
            );
    }
      return NextResponse.json(
        {
          success: false as const,
          error: "Invalid request data",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { reviews, sourceType, sourceUrl, fileName } = parsed.data;

    const shareableSlug = generateShareableSlug();

    // Create the session first — reviews reference it via sessionId
    const session = await prisma.analysisSession.create({
      data: {
        shareableSlug,
        sourceType: sourceType === "csv" ? "CSV" : "URL",
        sourceUrl: sourceUrl ?? null,
        fileName: fileName ?? null,
        status: "PENDING",
        totalReviews: reviews.length,
      },
    });

    // createMany is significantly faster than looping create() for bulk inserts
    await prisma.review.createMany({
      data: reviews.map((r) => ({
        sessionId: session.id,
        text: r.text,
        rating: r.rating ?? null,
        author: r.author ?? null,
        date: r.date ?? null,
      })),
    });

    return NextResponse.json({
      success: true as const,
      data: {
        sessionId: session.id,
        shareableSlug: session.shareableSlug,
      },
    });
  } catch (error) {
    console.error("[POST /api/analysis]", error);
    return NextResponse.json(
      {
        success: false as const,
        error: "Failed to create analysis session.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}