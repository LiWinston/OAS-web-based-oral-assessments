"use client";

import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import clsx from "clsx";

const DELTA_THRESHOLD = 5;

const columns = [
  { id: "examinerName", label: "Examiner", width: "40%" },
  { id: "sessionCount", label: "Sessions", align: "right", width: "15%" },
  { id: "averageScore", label: "Average score", align: "right", width: "20%" },
  { id: "delta", label: "Δ vs overall", align: "right", width: "25%" },
];

const formatNumber = (value, digits = 1) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  if (digits === 0) {
    return Math.round(numeric).toString();
  }
  return numeric.toFixed(digits);
};

export default function ExaminerTrendTable({
  rows,
  loading,
  error,
  onRetry,
  onRowClick,
  sortBy,
  sortDirection,
  onSortChange,
  assignmentName,
  status,
  hasMixedSubjects,
  cohortAverage,
}) {
  const sortedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    const next = [...rows];
    next.sort((a, b) => {
      const aValue = a?.[sortBy] ?? 0;
      const bValue = b?.[sortBy] ?? 0;
      const aIsNullish = a?.[sortBy] === null || a?.[sortBy] === undefined;
      const bIsNullish = b?.[sortBy] === null || b?.[sortBy] === undefined;

      if (aIsNullish && bIsNullish) return 0;
      if (aIsNullish) return 1;
      if (bIsNullish) return -1;

      if (aValue === bValue) return 0;
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue > bValue ? -1 : 1;
    });
    return next;
  }, [rows, sortBy, sortDirection]);

  if (loading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-100">
        <div className="flex items-start gap-3">
          <i className="fas fa-circle-exclamation text-lg" />
          <div className="space-y-2">
            <p>Failed to load examiner summary: {error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full border border-rose-400 px-3 py-1 text-xs font-semibold text-rose-700 hover:border-rose-500 hover:text-rose-800 dark:border-rose-700 dark:text-rose-100"
              >
                <i className="fas fa-rotate-right" /> Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!sortedRows || sortedRows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-12 text-center text-sm text-gray-600 dark:border-blue-700/70 dark:bg-gray-900 dark:text-gray-300">
        <i className="fas fa-user-group mb-3 text-2xl text-blue-400" />
        <p className="font-semibold">No marking data yet</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Once examiners submit marks, the trend for {assignmentName || "this assignment"} will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex flex-col gap-1 text-gray-900 dark:text-gray-100">
          <span className="font-semibold">Examiner scoring summary</span>
          {hasMixedSubjects && (
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-amber-600 dark:text-amber-300">
              Mixed cohort
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 md:text-right">
          <p>
            {status === "ALL"
              ? "Draft or rework entries count toward submissions but are excluded from averages."
              : "Only submitted marks are counted in totals and averages."}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            Baseline <strong>{formatNumber(cohortAverage)}</strong> — weighted across all submitted marks.
          </p>
        </div>
      </div>
      <Table className="text-sm">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={clsx("cursor-pointer select-none", column.align === "right" && "text-right", column.width && `w-[${column.width}]`)}
                onClick={() => handleSort(column.id, sortBy, sortDirection, onSortChange)}
              >
                <span className="inline-flex items-center gap-1">
                  {column.label}
                  <SortIcon active={sortBy === column.id} direction={sortBy === column.id ? sortDirection : undefined} />
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => {
            const delta = typeof row.delta === "number" ? row.delta : null;
            const isHigh = delta !== null && delta >= DELTA_THRESHOLD;
            const isLow = delta !== null && delta <= -DELTA_THRESHOLD;
            const showDeltaHighlight = delta !== null && Math.abs(delta) >= DELTA_THRESHOLD;
            const sessionCount = row.sessionCount ?? row.submissionCount ?? 0;

            return (
              <TableRow
                key={row.examinerId || row.examinerName}
                className="cursor-pointer transition-colors hover:bg-blue-50/70 dark:hover:bg-blue-950/40"
                onClick={() => onRowClick?.(row)}
              >
                <TableCell className="align-middle">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{row.examinerName || "Unnamed"}</span>
                    {row.examinerEmail && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{row.examinerEmail}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-gray-700 dark:text-gray-200">
                  {formatNumber(sessionCount, 0)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={clsx("inline-flex items-center gap-2 font-semibold", {
                      "text-emerald-600 dark:text-emerald-400": isHigh,
                      "text-rose-600 dark:text-rose-400": isLow,
                    })}
                  >
                    {formatNumber(row.averageScore)}
                    {(isHigh || isLow) && (
                      <Badge variant="outline" className={clsx("border-current px-2 py-0 text-xs")}>{isHigh ? "High" : "Low"}</Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={clsx("font-semibold", {
                      "text-emerald-600 dark:text-emerald-400": delta > 0 && showDeltaHighlight,
                      "text-rose-600 dark:text-rose-400": delta < 0 && showDeltaHighlight,
                      "text-gray-700 dark:text-gray-200": !showDeltaHighlight,
                    })}
                  >
                    {delta > 0 ? "+" : ""}{formatNumber(delta)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function handleSort(columnId, currentSortBy, currentDirection, onSortChange) {
  if (!onSortChange) return;
  if (currentSortBy === columnId) {
    const nextDirection = currentDirection === "asc" ? "desc" : "asc";
    onSortChange(columnId, nextDirection);
    return;
  }
  const initialDirection = columnId === "examinerName" ? "asc" : "desc";
  onSortChange(columnId, initialDirection);
}

function SortIcon({ active, direction }) {
  if (!active) {
    return <i className="fas fa-sort text-xs text-gray-400" aria-hidden />;
  }
  if (direction === "asc") {
    return <i className="fas fa-sort-up text-xs" aria-hidden />;
  }
  return <i className="fas fa-sort-down text-xs" aria-hidden />;
}

function TableSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-6 py-4 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300">
        Examiner scoring summary
      </div>
      <div className="space-y-3 px-6 py-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200/60 bg-gray-100/80 px-4 py-4 dark:border-gray-700/60 dark:bg-gray-800/40"
          >
            <div className="h-4 w-40 animate-pulse rounded-full bg-gray-300/80 dark:bg-gray-600/60" />
            <div className="h-4 w-12 animate-pulse rounded-full bg-gray-300/70 dark:bg-gray-600/50" />
            <div className="h-4 w-16 animate-pulse rounded-full bg-gray-300/80 dark:bg-gray-600/60" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-gray-300/70 dark:bg-gray-600/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
