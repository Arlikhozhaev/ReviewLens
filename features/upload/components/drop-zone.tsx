"use client";

import { Upload, FileText, X } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useFileDrop } from "../hooks/use-file-drop";

interface DropZoneProps {
  onFile: (file: File) => void;
  isParsing: boolean;
  error: string | null;
  onClearError: () => void;
  currentFile: File | null;
}

export function DropZone({
  onFile,
  isParsing,
  error,
  onClearError,
  currentFile,
}: DropZoneProps) {
  const {
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    openFilePicker,
    fileInputRef,
    onFileInputChange,
  } = useFileDrop(onFile);

  return (
    <div className="w-full space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={onFileInputChange}
        aria-label="Upload CSV file"
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Drop CSV file here or click to upload"
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openFilePicker();
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative flex min-h-[220px] w-full cursor-pointer flex-col",
          "items-center justify-center gap-4 rounded-xl border-2 border-dashed",
          "transition-all duration-200 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging
            ? "scale-[1.01] border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50",
          isParsing && "pointer-events-none opacity-60"
        )}
      >
        {isParsing ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Parsing your CSV...</p>
          </div>
        ) : currentFile ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{currentFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(Math.round(currentFile.size / 1_024))} KB · click to change
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                isDragging ? "bg-primary/15" : "bg-muted"
              )}
            >
              <Upload
                className={cn(
                  "h-5 w-5 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragging ? "Drop it here" : "Drag your CSV here"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                or click to browse · max 10 MB
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
            >
              Choose file
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <span className="flex-1 text-destructive">{error}</span>
          <button
            type="button"
            onClick={onClearError}
            aria-label="Dismiss error"
            className="mt-0.5 shrink-0 text-destructive/70 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!error && !currentFile && (
        <p className="text-center text-xs text-muted-foreground">
          Required column:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            review
          </code>{" "}
          · Optional:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            rating
          </code>{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            author
          </code>{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            date
          </code>
        </p>
      )}
    </div>
  );
}