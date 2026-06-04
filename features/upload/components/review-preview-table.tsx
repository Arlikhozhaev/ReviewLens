import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
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

export function ReviewPreviewTable({ result }: ReviewPreviewTableProps) {
  const preview = result.reviews.slice(0, PREVIEW_LIMIT);
  const overflow = result.reviews.length - PREVIEW_LIMIT;
  const { detectedColumns: cols } = result;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <span className="font-medium text-muted-foreground">Columns mapped:</span>
        <ColumnBadge label="review" col={cols.reviewColumn} />
        {cols.ratingColumn && <ColumnBadge label="rating" col={cols.ratingColumn} />}
        {cols.authorColumn && <ColumnBadge label="author" col={cols.authorColumn} />}
        {cols.dateColumn && <ColumnBadge label="date" col={cols.dateColumn} />}
      </div>

      {/* Preview table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 text-xs">#</TableHead>
              <TableHead className="text-xs">Review</TableHead>
              {cols.ratingColumn && (
                <TableHead className="w-20 text-xs">Rating</TableHead>
              )}
              {cols.authorColumn && (
                <TableHead className="w-28 text-xs">Author</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((review, i) => (
              <TableRow key={review.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="text-sm">
                  <p className="line-clamp-2 text-foreground">
                    {truncate(review.text, 140)}
                  </p>
                </TableCell>
                {cols.ratingColumn && (
                  <TableCell className="text-xs">
                    {review.rating != null ? (
                      <Badge variant="secondary">{review.rating}/5</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
                {cols.authorColumn && (
                  <TableCell className="max-w-[7rem] truncate text-xs text-muted-foreground">
                    {review.author || "—"}
                  </TableCell>
                )}
              </TableRow>
            ))}

            {overflow > 0 && (
              <TableRow>
                <TableCell
                  colSpan={
                    2 +
                    (cols.ratingColumn ? 1 : 0) +
                    (cols.authorColumn ? 1 : 0)
                  }
                  className="py-3 text-center text-xs text-muted-foreground"
                >
                  +{formatNumber(overflow)} more not shown
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
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
    neutral: "border-border bg-muted/50 text-muted-foreground",
  };

  return (
    <div className={cn("rounded-lg border p-3", styles[color])}>
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-xl font-bold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function ColumnBadge({ label, col }: { label: string; col: string }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="text-muted-foreground">{label} →</span>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
        {col}
      </code>
    </span>
  );
}