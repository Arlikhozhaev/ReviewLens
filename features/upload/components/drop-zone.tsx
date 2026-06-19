"use client";

import { Upload, FileText, X, Download, FileSpreadsheet } from "lucide-react";
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

  function downloadSampleCsv(type: "app" | "ecommerce") {
    const appReviews = [
      ["review", "rating", "author", "date"],
      ["Absolutely love this app! The dark mode is gorgeous and the insights are spot on.", "5", "Sarah Jenkins", "2026-06-15"],
      ["It's decent but crashes occasionally when importing large datasets. Needs optimization.", "3", "Michael Chen", "2026-06-14"],
      ["Terrible customer support. I submitted an issue three days ago and haven't heard back.", "1", "David K.", "2026-06-12"],
      ["A must-have for product managers. Saves me hours of manual categorization every week.", "5", "Elena Rostova", "2026-06-10"],
      ["Good tool, but I wish it supported more languages. Most of my reviews are in German.", "4", "Hans Schmidt", "2026-06-08"],
      ["The sentiment analysis is surprisingly accurate. Highly recommend!", "5", "Jane Doe", "2026-06-05"],
      ["Very unintuitive UI. Took me 20 minutes to find how to export my data.", "2", "Robert Smith", "2026-06-03"],
      ["Excellent performance, handles large files with ease. A solid 4 stars.", "4", "Lisa Wang", "2026-06-01"],
      ["Pricing is too steep for small teams. The free tier is very limited.", "3", "Marc Dupuis", "2026-05-30"],
      ["Game changer! Our team is now fixing the bugs that customers actually care about.", "5", "Tom Wilson", "2026-05-28"]
    ];

    const ecommerceReviews = [
      ["review", "rating", "author", "date"],
      ["The shoes look great, but they are extremely tight around the toes. Had to return.", "2", "Brian M.", "2026-06-16"],
      ["Super fast delivery! The package arrived in perfect condition and the product is high quality.", "5", "Amy L.", "2026-06-15"],
      ["The color is completely different from the website pictures. It looks yellow, not beige.", "2", "Jessica Taylor", "2026-06-13"],
      ["Very comfortable mattress. My back pain has completely disappeared since using it.", "5", "Arthur Pendelton", "2026-06-11"],
      ["Average product. It does what it says, but the material feels a bit cheap.", "3", "Oliver K.", "2026-06-09"],
      ["Brokes after two weeks of normal usage. Very disappointed with the build quality.", "1", "Marcus Aurelius", "2026-06-07"],
      ["Best headphones I've ever owned. Active noise canceling is top tier.", "5", "Sophia Martinez", "2026-06-04"],
      ["Instruction manual was missing. Setting it up was a total guessing game.", "2", "George B.", "2026-06-02"]
    ];

    const rows = type === "app" ? appReviews : ecommerceReviews;
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reviewlens_sample_${type}_reviews.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="w-full space-y-4">
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
          "relative flex min-h-[260px] w-full cursor-pointer flex-col",
          "items-center justify-center gap-4 rounded-2xl border-2 border-dashed",
          "transition-all duration-300 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "surface-glass shadow-lg hover:shadow-xl",
          isDragging
            ? "scale-[1.01] border-primary bg-primary/5 glow-ring"
            : "border-border/85 bg-card/45 hover:border-primary/45 hover:bg-card/75",
          isParsing && "pointer-events-none opacity-60"
        )}
      >
        {isParsing ? (
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="rounded-full bg-primary/10 p-4">
              <LoadingSpinner size="lg" className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Parsing CSV data...</p>
            <p className="text-xs text-muted-foreground">This only takes a second.</p>
          </div>
        ) : currentFile ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center animate-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 shadow-inner">
              <FileSpreadsheet className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground truncate max-w-md">{currentFile.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatNumber(Math.round(currentFile.size / 1_024))} KB · Click to change file
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-xs h-8 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
            >
              Replace file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm border",
                isDragging 
                  ? "bg-primary border-primary text-primary-foreground scale-110" 
                  : "bg-muted/80 border-border/80 text-muted-foreground group-hover:scale-105"
              )}
            >
              <Upload
                className={cn(
                  "h-6 w-6 transition-transform",
                  isDragging ? "animate-bounce" : ""
                )}
                strokeWidth={2}
              />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold tracking-tight text-foreground">
                {isDragging ? "Drop your reviews file here" : "Drag & drop your CSV file"}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse local files (max 10 MB)
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="px-5 shadow-sm h-9"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
            >
              Select CSV File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm animate-in">
          <span className="flex-1 font-medium text-destructive">{error}</span>
          <button
            type="button"
            onClick={onClearError}
            aria-label="Dismiss error"
            className="mt-0.5 shrink-0 text-destructive/70 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!error && !currentFile && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              Required column:{" "}
              <code className="rounded bg-muted-foreground/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                review
              </code>{" "}
              · Optional metadata:{" "}
              <code className="rounded bg-muted-foreground/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                rating
              </code>{" "}
              <code className="rounded bg-muted-foreground/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                author
              </code>{" "}
              <code className="rounded bg-muted-foreground/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                date
              </code>
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground font-medium">Need a test file? Try our templates:</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground"
                onClick={() => downloadSampleCsv("app")}
              >
                <Download className="h-3 w-3" />
                App Reviews CSV
              </Button>
              <span className="text-border text-xs self-center">|</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground"
                onClick={() => downloadSampleCsv("ecommerce")}
              >
                <Download className="h-3 w-3" />
                E-commerce CSV
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}