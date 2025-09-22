"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAssignmentResultsSummary } from "@/hooks/admin/useAssignmentResultsSummary.js";

const readinessStyles = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40",
  idle: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/60",
};

const readinessIcon = (done) => (done ? "fa-check" : "fa-circle" );

function ReadinessChip({ label, active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active ? readinessStyles.active : readinessStyles.idle
      }`}
    >
      <i className={`fas ${readinessIcon(active)} text-[10px]`} />
      {label}
    </span>
  );
}

function MetricPanel({ label, value, accent }) {
  const tone = accent ?? "text-blue-600 dark:text-blue-300";
  return (
    <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900/50 px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-bold leading-none ${tone}`}>{value}</div>
    </div>
  );
}

export function ResultsHubAssignmentRow({ courseId, assignment }) {
  const subjectId = courseId;
  const assignmentId = assignment?.id ?? assignment?.assignmentId;

  const { data: summary, isLoading, isError } = useAssignmentResultsSummary(subjectId, assignmentId, {
    enabled: Boolean(subjectId && assignmentId),
  });

  const resultsHref = assignmentId
    ? `/admin/courses/${subjectId}/assignments/${assignmentId}/results`
    : undefined;

  const rubricReady = Boolean(
    assignment?.hasRubric ||
      assignment?.rubricConfigured ||
      assignment?.rubricStatus === "CONFIGURED"
  );

  const sessionsReady = Boolean(
    assignment?.hasTimeSlots ||
      assignment?.timeSlotsConfigured ||
      assignment?.scheduleConfigured ||
      assignment?.schedule?.configured
  );

  const resultsReleased = Boolean(
    assignment?.resultsReleased ||
      assignment?.results?.released ||
      assignment?.resultStatus === "RELEASED"
  );

  const total = summary?.total ?? 0;
  const released = summary?.released ?? 0;
  const pending = summary?.pending ?? Math.max(total - released, 0);
  const avgScore = summary?.averageScore;

  const displayCount = (value) => {
    if (isLoading) return "…";
    if (typeof value === "number") return value;
    return "—";
  };

  const displayAverage = () => {
    if (isLoading) return "…";
    if (typeof avgScore === "number") {
      return `${avgScore.toFixed(1)}%`;
    }
    return "—";
  };

  const metrics = [
    { label: "Assessments", value: displayCount(total) },
    { label: "Released", value: displayCount(released), accent: "text-emerald-600 dark:text-emerald-400" },
    { label: "Pending", value: displayCount(pending), accent: "text-blue-600 dark:text-blue-400" },
    { label: "Average", value: displayAverage() },
  ];

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900/40 shadow-sm transition-all duration-200 hover:shadow-xl">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-sky-500 via-indigo-500 to-purple-500" aria-hidden="true" />
      <div className="relative p-6 md:p-8 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300">
              <i className="fas fa-clipboard-check text-2xl" />
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 truncate">
                  {assignment?.name || `Assignment ${assignmentId}`}
                </h3>
                {assignment?.type && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                    {assignment.type}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {assignment?.description || "Track examiner submissions, consolidate marks, and release student feedback."}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1"><i className="fas fa-id-badge" />Assignment ID: {assignmentId || '—'}</span>
                {assignment?.courseCode && (
                  <span className="flex items-center gap-1"><i className="fas fa-book" />{assignment.courseCode}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ReadinessChip label="Rubric" active={rubricReady} />
            <ReadinessChip label="Sessions" active={sessionsReady} />
            <ReadinessChip label="Results" active={resultsReleased} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <MetricPanel key={metric.label} label={metric.label} value={metric.value} accent={metric.accent} />
            ))}
          </div>

          <div className="flex flex-col justify-between gap-3">
            {isError ? (
              <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                Failed to load summary.
              </div>
            ) : isLoading ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/40 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 animate-pulse text-center">
                Fetching metrics…
              </div>
            ) : (
              <div className="rounded-xl border border-sky-200/80 dark:border-sky-700/60 bg-sky-50/70 dark:bg-sky-900/20 px-4 py-3 text-xs text-sky-900 dark:text-sky-100">
                <span className="font-semibold">Tip:</span> Review pending assessments before releasing results to students.
              </div>
            )}

            <Button
              asChild={Boolean(resultsHref)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-md"
              disabled={!resultsHref}
            >
              {resultsHref ? (
                <Link href={resultsHref}>
                  <i className="fas fa-arrow-right" />
                  Open Results
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  <i className="fas fa-lock" />
                  Awaiting setup
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsHubAssignmentRow;
