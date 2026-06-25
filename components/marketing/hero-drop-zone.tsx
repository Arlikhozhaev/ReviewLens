"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileSpreadsheet, Upload } from "lucide-react";
import { useFileDrop } from "@/features/upload";
import { setPendingUpload } from "@/lib/pending-upload";
import { cn } from "@/lib/utils";

export function HeroDropZone() {
  const router = useRouter();

  const handleFile = useCallback(
    (file: File) => {
      setPendingUpload(file);
      router.push("/analyze");
    },
    [router]
  );

  const {
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    openFilePicker,
    fileInputRef,
    onFileInputChange,
  } = useFileDrop(handleFile);

  return (
    <div className="w-full max-w-xl">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={onFileInputChange}
        aria-label="Upload CSV file to analyze reviews"
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Drop your CSV here to start analyzing reviews for free"
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openFilePicker();
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-4 text-left transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging
            ? "scale-[1.01] border-primary bg-primary/5 shadow-[0_0_0_4px_oklch(0.45_0.2_264/0.12)]"
            : "border-border/80 bg-card/70 shadow-sm backdrop-blur-sm hover:border-primary/40 hover:bg-card hover:shadow-md"
        )}
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            isDragging
              ? "bg-primary text-primary-foreground"
              : "bg-brand-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          )}
        >
          {isDragging ? (
            <FileSpreadsheet className="h-5 w-5" strokeWidth={2} />
          ) : (
            <Upload className="h-5 w-5" strokeWidth={2} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {isDragging ? "Drop it — we'll analyze it" : "Try it now — drop your CSV"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Free to start · sign in with email · results in under 60 seconds
          </p>
        </div>

        <span
          className={cn(
            "hidden shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex",
            isDragging
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
          )}
        >
          Browse
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
