import { AlertTriangle } from "lucide-react";
import type { CsvParseError } from "@/types";

interface UploadErrorListProps {
  errors: CsvParseError[];
}

const MAX_SHOWN = 5;

export function UploadErrorList({ errors }: UploadErrorListProps) {
  if (errors.length === 0) return null;

  const shown = errors.slice(0, MAX_SHOWN);
  const overflow = errors.length - MAX_SHOWN;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {errors.length} row{errors.length !== 1 ? "s" : ""} skipped
        </span>
      </div>

      <ul className="space-y-1">
        {shown.map((err, i) => (
          <li key={i} className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
            {err.row > 0 && (
              <span className="shrink-0 font-mono text-amber-500">
                row {err.row}
              </span>
            )}
            <span>{err.message}</span>
          </li>
        ))}
        {overflow > 0 && (
          <li className="text-xs text-amber-600 dark:text-amber-500">
            …and {overflow} more
          </li>
        )}
      </ul>
    </div>
  );
}