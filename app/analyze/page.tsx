"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, RotateCcw, Sparkles, Upload, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { consumePendingUpload } from "@/lib/pending-upload";
import type { CreateAnalysisResponse } from "@/app/api/analysis/route";
import { cn } from "@/lib/utils";

type Step = "upload" | "preview" | "submitting";

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const { parse, result, isParsing, error, reset } = useCsvParser();

  // Pick up a CSV dropped on the landing page hero
  useEffect(() => {
    const pending = consumePendingUpload();
    if (pending) {
      setCurrentFile(pending);
      parse(pending);
    }
  }, [parse]);

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

  const stepsList = [
    { id: "upload", label: "Upload File", icon: Upload },
    { id: "preview", label: "Verify Data", icon: FileText },
    { id: "submitting", label: "Extract Insights", icon: Sparkles }
  ] as const;

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
      {/* Background Mesh matching marketing page */}
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <Navbar />

      <main className="container relative flex flex-1 flex-col items-center py-12 px-4 md:py-16">
        {/* Header */}
        <div className="mb-10 w-full max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary animate-fade-up">
            <Sparkles className="h-3 w-3 fill-primary/10" />
            AI-powered theme clustering
          </div>
          <h1 className="text-display max-w-3xl text-balance text-foreground tracking-tight py-1">
            Analyze your <span className="text-gradient">reviews</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Upload your customer feedback sheet. We&apos;ll automatically group reviews by theme, map sentiments, and construct summaries.
          </p>
        </div>

        {/* Stepper Wizard */}
        <div className="mb-10 w-full max-w-md bg-card/40 border border-border/60 rounded-full px-4 py-2 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            {stepsList.map((s, index) => {
              const isCurrent = step === s.id;
              const isCompleted = 
                (step === "preview" && s.id === "upload") || 
                (step === "submitting" && (s.id === "upload" || s.id === "preview"));
              const Icon = s.icon;
              
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                        isCurrent && "border-primary bg-primary text-primary-foreground scale-110 shadow-sm",
                        isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                        !isCurrent && !isCompleted && "border-border bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span className={cn(
                      "text-[10px] font-semibold tracking-tight transition-colors",
                      isCurrent && "text-primary",
                      isCompleted && "text-emerald-500",
                      !isCurrent && !isCompleted && "text-muted-foreground"
                    )}>
                      {s.label}
                    </span>
                  </div>
                  
                  {index < stepsList.length - 1 && (
                    <div className="h-[2px] w-8 sm:w-16 mx-2 bg-border relative -top-3 rounded">
                      <div 
                        className={cn(
                          "absolute inset-0 bg-primary transition-all duration-500 rounded",
                          (step === "preview" && index === 0) || step === "submitting" ? "w-full" : "w-0"
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Form Card */}
        <div className="w-full max-w-2xl bg-card/60 border border-border/80 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl animate-fade-up relative z-10">
          <ErrorBoundary>
            {step === "upload" && (
              <div className="space-y-4">
                <DropZone
                  onFile={handleFile}
                  isParsing={isParsing}
                  error={error}
                  onClearError={reset}
                  currentFile={currentFile}
                />
              </div>
            )}

            {step !== "upload" && result && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">File parsed successfully</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Please confirm details below before running analysis.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    disabled={step === "submitting"}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>

                <ReviewPreviewTable result={result} />

                {result.errors.length > 0 && (
                  <UploadErrorList errors={result.errors} />
                )}

                {showLowCountWarning && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3.5 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-400">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      Low review count ({result.validRows})
                    </p>
                    <p className="text-xs mt-1 text-amber-600/90 dark:text-amber-400/80 leading-relaxed">
                      AI clustering works best with 10+ reviews. Fewer reviews may result in less distinct themes.
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={step === "submitting" || result.validRows === 0}
                    className="gap-2 px-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-r from-primary to-primary/95 text-primary-foreground"
                  >
                    {step === "submitting" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Analyzing reviews...
                      </span>
                    ) : (
                      <>
                        Start AI Analysis
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}