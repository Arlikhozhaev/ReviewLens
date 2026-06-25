import type { StoredAnalysisResult } from "@/features/analysis/types";

type Cell = string | number | null | undefined;

function escapeCsv(value: Cell): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

export function buildSummaryCsv(
  result: StoredAnalysisResult,
  totalReviews: number
): string {
  const meta: Cell[][] = [
    ["ReviewLens analysis summary"],
    ["Generated", new Date().toISOString()],
    ["Total reviews", totalReviews],
    ["Themes", result.themes.length],
    ["Average rating", result.averageRating ?? ""],
    ["Sentiment — positive", result.sentimentBreakdown.positive],
    ["Sentiment — negative", result.sentimentBreakdown.negative],
    ["Sentiment — neutral", result.sentimentBreakdown.neutral],
    ["Sentiment — mixed", result.sentimentBreakdown.mixed],
    ["Executive summary", result.executiveSummary],
    [],
  ];

  const header: Cell[] = [
    "Theme",
    "Sentiment",
    "Reviews",
    "Percentage",
    "Description",
    "Example quotes",
  ];

  const themeRows: Cell[][] = [...result.themes]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .map((t) => [
      t.label,
      t.sentiment,
      t.reviewCount,
      `${t.percentage.toFixed(1)}%`,
      t.description,
      t.exampleQuotes.join(" | "),
    ]);

  return toCsv([...meta, header, ...themeRows]);
}

export function downloadTextFile(
  content: string,
  filename: string,
  mime = "text/csv;charset=utf-8"
): void {
  // Prepend a BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(["\uFEFF", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
