"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  RotateCcw,
  Sparkles,
  Upload,
  FileText,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/navbar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  DropZone,
  ImportMethodSwitch,
  PasteReviewsForm,
  ReviewPreviewTable,
  UploadErrorList,
  useCsvParser,
  type ImportMethod,
} from "@/features/upload";
import { apiFetch, apiPost } from "@/lib/api";
import { MIN_REVIEWS_FOR_CLUSTERING } from "@/lib/constants";
import { consumePendingUpload } from "@/lib/pending-upload";
import type { CreateAnalysisResponse } from "@/app/api/analysis/route";
import type { OrgSummary } from "@/app/api/orgs/route";
import type { CsvParseResult } from "@/features/upload/types";
import { cn, formatNumber } from "@/lib/utils";

type Step = "upload" | "preview" | "submitting";

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [inputMode, setInputMode] = useState<ImportMethod>("csv");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [pasteResult, setPasteResult] = useState<CsvParseResult | null>(null);
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>("personal");

  const { parse, result: csvResult, isParsing, error, reset } = useCsvParser();
  const result = inputMode === "csv" ? csvResult : pasteResult;

  useEffect(() => {
    void apiFetch<{ orgs: OrgSummary[] }>("/api/orgs")
      .then((data) => setOrgs(data.orgs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pending = consumePendingUpload();
    if (pending) {
      setInputMode("csv");
      setCurrentFile(pending);
      parse(pending);
    }
  }, [parse]);

  useEffect(() => {
    if (result && result.validRows > 0 && step === "upload") {
      setStep("preview");
    }
  }, [result, step]);

  const handleFile = useCallback(
    (file: File) => {
      setInputMode("csv");
      setCurrentFile(file);
      setPasteResult(null);
      setSourceLabel(file.name);
      parse(file);
    },
    [parse]
  );

  const handlePasteParsed = useCallback(
    (parsed: CsvParseResult, label: string) => {
      setInputMode("paste");
      setCurrentFile(null);
      reset();
      setPasteResult(parsed);
      setSourceLabel(label);
      setStep("preview");
    },
    [reset]
  );

  const handleReset = useCallback(() => {
    reset();
    setCurrentFile(null);
    setPasteResult(null);
    setSourceLabel("");
    setStep("upload");
  }, [reset]);

  const handleSubmit = useCallback(async () => {
    if (!result) return;

    setStep("submitting");
    const loadingToast = toast.loading("Uploading reviews...");

    try {
      const response = await apiPost<CreateAnalysisResponse>("/api/analysis", {
        reviews: result.reviews,
        sourceType: inputMode === "paste" ? "paste" : "csv",
        fileName: sourceLabel || currentFile?.name,
        organizationId:
          workspaceId !== "personal" ? workspaceId : undefined,
      });

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
  }, [result, inputMode, sourceLabel, currentFile, workspaceId, router]);

  const showLowCountWarning =
    result && result.validRows > 0 && result.validRows < MIN_REVIEWS_FOR_CLUSTERING;

  const stepsList = [
    { id: "upload", label: "Import", icon: Upload },
    { id: "preview", label: "Verify", icon: FileText },
    { id: "submitting", label: "Analyze", icon: Sparkles },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <Navbar />

      <main className="container relative flex flex-1 flex-col items-center py-10 px-4 md:py-14">
        <div className="mb-8 w-full max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary animate-fade-up">
            <Sparkles className="h-3 w-3 fill-primary/10" />
            AI-powered theme clustering
          </div>
          <h1 className="text-display max-w-3xl text-balance text-foreground tracking-tight py-1">
            Analyze your <span className="text-gradient">reviews</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Import from a CSV or paste text from Amazon, G2, App Store, or anywhere else.
          </p>
        </div>

        <div className="mb-8 w-full max-w-lg bg-card/40 border border-border/60 rounded-full px-4 py-2 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            {stepsList.map((s, index) => {
              const isCurrent = step === s.id;
              const isCompleted =
                (step === "preview" && s.id === "upload") ||
                (step === "submitting" &&
                  (s.id === "upload" || s.id === "preview"));
              const Icon = s.icon;

              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                        isCurrent &&
                          "border-primary bg-primary text-primary-foreground scale-110 shadow-sm",
                        isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                        !isCurrent &&
                          !isCompleted &&
                          "border-border bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold tracking-tight transition-colors",
                        isCurrent && "text-primary",
                        isCompleted && "text-emerald-500",
                        !isCurrent && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>

                  {index < stepsList.length - 1 && (
                    <div className="h-[2px] w-10 sm:w-14 mx-2 bg-border relative -top-3 rounded">
                      <div
                        className={cn(
                          "absolute inset-0 bg-primary transition-all duration-500 rounded",
                          (step === "preview" && index === 0) ||
                            step === "submitting"
                            ? "w-full"
                            : "w-0"
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-card/60 shadow-xl backdrop-blur-xl animate-fade-up relative z-10">
          <ErrorBoundary>
            {step === "upload" && (
              <>
                <div className="border-b border-border/70 bg-muted/25 px-5 py-5 md:px-7">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step 1 · Choose how to import
                  </p>
                  <ImportMethodSwitch
                    value={inputMode}
                    onChange={setInputMode}
                    disabled={isParsing}
                  />
                </div>

                <div className="p-5 md:p-7">
                  {inputMode === "csv" ? (
                    <DropZone
                      onFile={handleFile}
                      isParsing={isParsing}
                      error={error}
                      onClearError={reset}
                      currentFile={currentFile}
                    />
                  ) : (
                    <PasteReviewsForm onParsed={handlePasteParsed} />
                  )}
                </div>
              </>
            )}

            {step !== "upload" && result && (
              <div className="space-y-6 p-5 md:p-7">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Step 2 · Verify
                    </p>
                    <h2 className="mt-1 text-base font-bold text-foreground">
                      {formatNumber(result.validRows)} reviews ready
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sourceLabel || (inputMode === "paste" ? "Pasted text" : "CSV file")}
                    </p>
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
                    Start over
                  </Button>
                </div>

                {orgs.length > 0 && (
                  <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <Label htmlFor="workspace" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Save to workspace
                    </Label>
                    <select
                      id="workspace"
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-input bg-background/80 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <option value="personal">Personal — only you</option>
                      {orgs.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} (team)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                      AI clustering works best with 10+ reviews. Fewer reviews may
                      result in less distinct themes.
                    </p>
                  </div>
                )}

                <div className="flex justify-end border-t border-border/70 pt-5">
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
