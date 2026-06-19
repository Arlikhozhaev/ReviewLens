import { CheckCircle2, AlertCircle, FileText, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatNumber, truncate } from "@/lib/utils";
import type { CsvParseResult } from "../types";

const PREVIEW_LIMIT = 5;

interface ReviewPreviewTableProps {
  result: CsvParseResult;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0" aria-label={`Rating: ${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < Math.round(rating)
              ? "fill-amber-450 text-amber-500"
              : "text-muted-foreground/30 fill-transparent"
          )}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}

export function ReviewPreviewTable({ result }: ReviewPreviewTableProps) {
  const preview = result.reviews.slice(0, PREVIEW_LIMIT);
  const overflow = result.reviews.length - PREVIEW_LIMIT;
  const { detectedColumns: cols } = result;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Valid reviews"
          value={formatNumber(result.validRows)}
          color="emerald"
        />
        <StatCard
          icon={<AlertCircle className="h-4 w-4" />}
          label="Skipped rows"
          value={formatNumber(result.invalidRows)}
          color={result.invalidRows > 0 ? "amber" : "neutral"}
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Total rows"
          value={formatNumber(result.totalRows)}
          color="neutral"
        />
      </div>

      {/* Column mapping */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-muted/10 px-3.5 py-2.5 text-xs">
        <span className="font-semibold text-muted-foreground">Columns mapped:</span>
        <div className="flex flex-wrap gap-1.5">
          <ColumnBadge label="review" col={cols.reviewColumn} />
          {cols.ratingColumn && <ColumnBadge label="rating" col={cols.ratingColumn} />}
          {cols.authorColumn && <ColumnBadge label="author" col={cols.authorColumn} />}
          {cols.dateColumn && <ColumnBadge label="date" col={cols.dateColumn} />}
        </div>
      </div>

      {/* Preview table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/80">
              <TableHead className="w-12 text-xs font-semibold text-muted-foreground">#</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Review preview</TableHead>
              {cols.ratingColumn && (
                <TableHead className="w-24 text-xs font-semibold text-muted-foreground text-center">Rating</TableHead>
              )}
              {cols.authorColumn && (
                <TableHead className="w-32 text-xs font-semibold text-muted-foreground">Author</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((review, i) => (
              <TableRow key={review.id} className="hover:bg-muted/15 transition-colors duration-150">
                <TableCell className="font-mono text-xs text-muted-foreground/70 pl-4">
                  {i + 1}
                </TableCell>
                <TableCell className="text-sm py-3.5">
                  <p className="line-clamp-2 text-foreground leading-relaxed">
                    {truncate(review.text, 140)}
                  </p>
                </TableCell>
                {cols.ratingColumn && (
                  <TableCell className="py-3.5">
                    <div className="flex justify-center">
                      {review.rating != null ? (
                        <div className="flex flex-col items-center gap-1">
                          <RatingStars rating={review.rating} />
                          <span className="text-[10px] font-mono text-muted-foreground/75 font-semibold">
                            {review.rating}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                )}
                {cols.authorColumn && (
                  <TableCell className="max-w-[8rem] truncate text-xs text-muted-foreground/80 font-medium py-3.5">
                    {review.author || "—"}
                  </TableCell>
                )}
              </TableRow>
            ))}

            {overflow > 0 && (
              <TableRow className="bg-muted/5 hover:bg-muted/5">
                <TableCell
                  colSpan={
                    2 +
                    (cols.ratingColumn ? 1 : 0) +
                    (cols.authorColumn ? 1 : 0)
                  }
                  className="py-4 text-center text-xs font-semibold text-muted-foreground/75"
                >
                  +{formatNumber(overflow)} more review{overflow !== 1 ? "s" : ""} in file (previewing first {PREVIEW_LIMIT})
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Internal sub-components ───────────────────────────────────────────────────

type CardColor = "emerald" | "amber" | "neutral";

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: CardColor;
}) {
  const styles: Record<CardColor, string> = {
    emerald:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.05)]",
    amber:
      "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.05)]",
    neutral: "border-border/60 bg-muted/40 text-muted-foreground shadow-sm",
  };

  return (
    <div className={cn("rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md", styles[color])}>
      <div className="mb-2 flex items-center gap-2">
        <span className="opacity-80">{icon}</span>
        <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground/80">{label}</span>
      </div>
      <span className="text-2xl font-extrabold tracking-tight tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function ColumnBadge({ label, col }: { label: string; col: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 font-medium shadow-xs">
      <span className="text-muted-foreground/80">{label}</span>
      <span className="text-[10px] text-muted-foreground/50 select-none">➔</span>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
        {col}
      </code>
    </span>
  );
}