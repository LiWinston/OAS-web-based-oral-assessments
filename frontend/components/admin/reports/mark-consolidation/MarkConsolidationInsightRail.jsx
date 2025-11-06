"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";

const fallbackAssignments = [];

const formatTime = (value) => {
  if (!value) return "Just now";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Just now";
    return date.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
  } catch (error) {
    return "Just now";
  }
};

const formatPercent = (numerator, denominator) => {
  if (!denominator || denominator === 0) return "0%";
  const value = (numerator / denominator) * 100;
  return `${value.toFixed(0)}%`;
};

function BreakdownRow({ icon, label, value, tone }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
      <span className="flex items-center gap-2">
        <i className={`fas ${icon}`} />
        {label}
      </span>
      <span className={`text-sm font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

export default function MarkConsolidationInsightRail({
  assignments,
  selectedAssignmentId,
  onSelectAssignment,
  summary,
  lastRefreshedAt,
  onRefresh,
  insights,
}) {
  const assignmentOptions = assignments || fallbackAssignments;
  const hasAssignments = assignmentOptions.length > 0;
  const stringifiedSelectedId = selectedAssignmentId ? String(selectedAssignmentId) : "";

  const selectedAssignment = useMemo(() => {
    if (!stringifiedSelectedId) return null;
    return assignmentOptions.find((assignment) => {
      const id = assignment.id ?? assignment.assignmentId;
      return String(id ?? "") === stringifiedSelectedId;
    }) ?? null;
  }, [assignmentOptions, stringifiedSelectedId]);

  const selectedAssignmentName = selectedAssignment
    ? selectedAssignment.name || selectedAssignment.assignmentName || ""
    : "";
  const selectedCourseLabel = selectedAssignment
    ? [
        (selectedAssignment.courseCode || selectedAssignment.course?.code || "").toUpperCase(),
        selectedAssignment.courseName || selectedAssignment.course?.name || "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const refreshLabel = formatTime(lastRefreshedAt);

  const breakdown = useMemo(() => ({
    ready: summary?.progress?.ready ?? 0,
    attention: summary?.progress?.attention ?? 0,
    incomplete: summary?.progress?.incomplete ?? 0,
    released: summary?.release?.released ?? 0,
    notReleased: summary?.release?.notReleased ?? 0,
    manualOverrides: summary?.manualOverrides ?? 0,
    examinersSubmitted: summary?.examinerTotals?.submitted ?? 0,
    examinersTotal: summary?.examinerTotals?.total ?? 0,
  }), [summary]);

  const highlightMessages = useMemo(() => {
    if (insights && insights.length) return insights;

    const messages = [];

    if (breakdown.attention > 0) {
      messages.push(`${breakdown.attention} participant${breakdown.attention === 1 ? "" : "s"} reopened for review.`);
    }

    if (breakdown.notReleased > 0) {
      messages.push(`${breakdown.notReleased} assessment${breakdown.notReleased === 1 ? "" : "s"} awaiting release.`);
    }

    if (breakdown.manualOverrides > 0) {
      messages.push(`${breakdown.manualOverrides} manual override${breakdown.manualOverrides === 1 ? "" : "s"} applied.`);
    }

    if (messages.length === 0) {
      messages.push("All examiner submissions are on track.");
    }

    return messages;
  }, [insights, breakdown.attention, breakdown.notReleased, breakdown.manualOverrides]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Assignment</div>
        {hasAssignments ? (
          <div className="mt-3">
            <Select value={stringifiedSelectedId} onValueChange={onSelectAssignment}>
              <SelectTrigger className="w-full justify-between min-h-[64px] px-4 py-3 text-sm leading-snug">
                <SelectValue placeholder="Select assignment" asChild>
                  {selectedAssignmentName ? (
                    <div className="flex flex-1 flex-col text-left">
                      <span
                        className="font-medium leading-5 text-gray-900 line-clamp-3 dark:text-gray-100"
                        title={selectedAssignmentName}
                      >
                        {selectedAssignmentName}
                      </span>
                      {selectedCourseLabel && (
                        <span
                          className="mt-1 text-xs text-gray-500 line-clamp-1 dark:text-gray-400"
                          title={selectedCourseLabel}
                        >
                          {selectedCourseLabel}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Select assignment</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-[280px]">
                {assignmentOptions.map((assignment) => (
                  <SelectItem key={assignment.id ?? assignment.assignmentId} value={String(assignment.id ?? assignment.assignmentId)}>
                    <div className="flex flex-col text-left">
                      <span
                        className="font-medium leading-5 text-gray-900 line-clamp-3 dark:text-gray-100"
                        title={assignment.name || assignment.assignmentName}
                      >
                        {assignment.name || assignment.assignmentName}
                      </span>
                      <span
                        className="text-xs text-gray-500 dark:text-gray-400"
                        title={`${(assignment.courseCode || assignment.course?.code || "").toUpperCase()} · ${assignment.courseName || assignment.course?.name || ""}`}
                      >
                        {(assignment.courseCode || assignment.course?.code || "").toUpperCase()} · {assignment.courseName || assignment.course?.name || ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No assignments available.</p>
        )}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Last refreshed</span>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <i className="fas fa-rotate-right" /> Refresh
          </button>
        </div>
        <div className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{refreshLabel}</div>
        <div className="mt-4 grid gap-3">
          <BreakdownRow icon="fa-check-circle" label="Ready" value={formatNumber(breakdown.ready)} tone="text-emerald-600" />
          <BreakdownRow icon="fa-exclamation-circle" label="Needs attention" value={formatNumber(breakdown.attention)} tone="text-amber-600" />
          <BreakdownRow icon="fa-hourglass-half" label="Awaiting examiners" value={formatNumber(breakdown.incomplete)} tone="text-sky-600" />
          <BreakdownRow icon="fa-paper-plane" label="Released" value={`${formatNumber(breakdown.released)} / ${formatNumber(breakdown.released + breakdown.notReleased)}`} tone="text-indigo-600" />
          <BreakdownRow
            icon="fa-user-check"
            label="Examiner submissions"
            value={`${formatPercent(breakdown.examinersSubmitted, breakdown.examinersTotal)} (${formatNumber(breakdown.examinersSubmitted)}/${formatNumber(breakdown.examinersTotal)})`}
            tone="text-blue-600"
          />
          <BreakdownRow icon="fa-pen" label="Manual overrides" value={formatNumber(breakdown.manualOverrides)} tone="text-rose-600" />
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-100">
        <div className="text-xs uppercase tracking-[0.3em]">Highlights</div>
        <ul className="mt-2 space-y-2">
          {highlightMessages.map((message, index) => (
            <li key={`${message}-${index}`} className="flex items-start gap-2">
              <span className="mt-[3px] inline-flex h-2 w-2 flex-none rounded-full bg-blue-500" />
              <span>{message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const formatNumber = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-AU").format(numeric);
};
