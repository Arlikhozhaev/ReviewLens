"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  DropZone,
  ReviewPreviewTable,
  UploadErrorList,
  useCsvParser,
} from "@/features/upload";
import { apiPost } from "@/lib/api";
import { MIN_REVIEWS_FOR_CLUSTERING } from "@/lib/constants";
import type { CreateAnalysisResponse } from "@/app/api/analysis/route";

type Step = "upload" | "preview" | "submitting";

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const { parse, result, isParsing, error, reset } = useCsvParser();

  // Advance to preview automatically when parsing succeeds
  useEffect(() => {
    if (result && result.validRows > 0 && !isParsing && step === "upload") {
      setStep("preview");
    }
  }, [result, isParsing, step]);

  const handleFile = useCallback(
    (file: File) => {
      setCurrentFile(file);
      parse(file);
    },
    [parse]
  );

  const handleReset = useCallback(() => {
    reset();
    setCurrentFile(null);
    setStep("upload");
  }, [reset]);

  const handleSubmit = useCallback(async () => {
    if (!result) return;

    setStep("submitting");
    const loadingToast = toast.loading("Uploading reviews...");

    try {
      const response = await apiPost<CreateAnalysisResponse>(
        "/api/analysis",
        {
          reviews: result.reviews,
          sourceType: "csv",
          fileName: currentFile?.name,
        }
      );

      toast.dismiss(loadingToast);
      toast.success("Reviews uploaded! Preparing analysis...");
      router.push(`/dashboard/${response.shareableSlug}`);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
      setStep("preview");
    }
  }, [result, currentFile, router]);

  const showLowCountWarning =
    result && result.validRows > 0 && result.validRows < MIN_REVIEWS_FOR_CLUSTERING;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container flex flex-1 flex-col items-center py-12">
        <div className="mb-10 w-full max-w-2xl text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Analyze your reviews
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a CSV file with customer reviews. We&apos;ll extract themes
            and insights automatically.
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-6">
          <ErrorBoundary>
            <DropZone
              onFile={handleFile}
              isParsing={isParsing}
              error={error}
              onClearError={reset}
              currentFile={currentFile}
            />

            {step !== "upload" && result && (
              <>
                <Separator />

                <div className="animate-in space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Review preview</h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="h-7 gap-1.5 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Use a different file
                    </Button>
                  </div>

                  <ReviewPreviewTable result={result} />

                  {result.errors.length > 0 && (
                    <UploadErrorList errors={result.errors} />
                  )}

                  {showLowCountWarning && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400">
                      <strong>Low count:</strong> {result.validRows} reviews may
                      produce less distinct clusters. Best results with 10+.
                    </p>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      disabled={step === "submitting" || result.validRows === 0}
                      className="gap-2"
                    >
                      {step === "submitting" ? (
                        "Uploading..."
                      ) : (
                        <>
                          Analyze {result.validRows} review
                          {result.validRows !== 1 ? "s" : ""}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}