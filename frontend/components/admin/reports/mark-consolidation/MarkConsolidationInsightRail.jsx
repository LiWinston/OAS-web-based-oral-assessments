"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";

const fallbackAssignments = [];

const formatNumber = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-AU").format(numeric);
};

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

const formatDateTime = (value) => {
  if (!value) return "No recent activity";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No recent activity";
    return date.toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "No recent activity";
  }
};

const formatAlertLabel = (type) => {
  switch ((type || "").toUpperCase()) {
    case "REOPENED":
      return { label: "Reopened", tone: "text-amber-600" };
    case "OVERDUE":
      return { label: "Overdue", tone: "text-rose-600" };
    case "MISSING_EXAMINER":
      return { label: "Missing examiner", tone: "text-indigo-600" };
    case "MANUAL_OVERRIDE_PENDING":
      return { label: "Override pending", tone: "text-purple-600" };
    default:
      return { label: "Attention", tone: "text-blue-600" };
  }
};

export default function MarkConsolidationInsightRail({
  assignments,
  selectedAssignmentId,
  onSelectAssignment,
  overview,
  alerts = [],
  lastRefreshedAt,
  onRefresh,
  isOverviewLoading,
}) {
  const assignmentOptions = assignments || fallbackAssignments;
  const hasAssignments = assignmentOptions.length > 0;

  const refreshLabel = formatTime(lastRefreshedAt);
  const progress = overview?.progress ?? {};
  const ready = progress.ready ?? 0;
  const needsAttention = progress.needsAttention ?? progress.attention ?? 0;
  const awaiting = progress.awaiting ?? progress.incomplete ?? 0;
  const release = overview?.release ?? {};
  const examinerSubmissions = overview?.examinerSubmissions ?? {};
  const freshness = overview?.freshness ?? {};

  const keyMessages = useMemo(() => {
    if (Array.isArray(alerts) && alerts.length > 0) {
      return alerts.slice(0, 3).map((alert) => {
        const meta = formatAlertLabel(alert.alertType);
        return {
          tone: meta.tone,
          label: meta.label,
          message: alert.message,
          time: formatDateTime(alert.lastUpdatedAt),
        };
      });
    }

    if (isOverviewLoading) {
      return [{ tone: "text-gray-500", label: "Loading", message: "Fetching dashboard insights…", time: "" }];
    }

    const messages = [];

    if (needsAttention > 0) {
      messages.push({
        tone: "text-amber-600",
        label: "Reopened",
        message: `${needsAttention} participant${needsAttention === 1 ? "" : "s"} require follow-up.`,
        time: formatDateTime(freshness.lastActivityAt),
      });
    }

    if (release.notReleased > 0) {
      messages.push({
        tone: "text-indigo-600",
        label: "Pending release",
        message: `${release.notReleased} assessment${release.notReleased === 1 ? "" : "s"} awaiting publish.`,
        time: formatDateTime(freshness.lastActivityAt),
      });
    }

    if ((examinerSubmissions.pending ?? 0) > 0) {
      messages.push({
        tone: "text-sky-600",
        label: "Examiner pending",
        message: `${examinerSubmissions.pending} submission${examinerSubmissions.pending === 1 ? "" : "s"} outstanding.`,
        time: formatDateTime(freshness.lastExaminerSubmissionAt),
      });
    }

    if (messages.length === 0) {
      messages.push({
        tone: "text-emerald-600",
        label: "On track",
        message: "All examiner submissions are progressing as expected.",
        time: formatDateTime(freshness.lastExaminerSubmissionAt),
      });
    }

    return messages;
  }, [
    alerts,
    needsAttention,
    release.notReleased,
    examinerSubmissions.pending,
    freshness.lastActivityAt,
    freshness.lastExaminerSubmissionAt,
    isOverviewLoading,
  ]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Assignment</div>
        {hasAssignments ? (
          <div className="mt-3">
            <Select
              value={selectedAssignmentId ? String(selectedAssignmentId) : ""}
              onValueChange={onSelectAssignment}
            >
              <SelectTrigger className="w-full justify-between">
                <SelectValue placeholder="Select assignment" />
              </SelectTrigger>
              <SelectContent className="min-w-[220px]">
                {assignmentOptions.map((assignment) => (
                  <SelectItem
                    key={assignment.id ?? assignment.assignmentId}
                    value={String(assignment.id ?? assignment.assignmentId)}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{assignment.name || assignment.assignmentName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(assignment.courseCode || assignment.course?.code || "").toUpperCase()} ·{" "}
                        {assignment.courseName || assignment.course?.name || ""}
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

      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
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
        <div className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {formatTime(lastRefreshedAt)}
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
            <span className="flex items-center gap-2">
              <i className="fas fa-clipboard-check text-emerald-500" />
              Ready
            </span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
              {isOverviewLoading ? "—" : formatNumber(ready)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
            <span className="flex items-center gap-2">
              <i className="fas fa-triangle-exclamation text-amber-500" />
              Needs attention
            </span>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-300">
              {isOverviewLoading ? "—" : formatNumber(needsAttention)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
            <span className="flex items-center gap-2">
              <i className="fas fa-hourglass-half text-sky-500" />
              Awaiting examiners
            </span>
            <span className="text-sm font-semibold text-sky-600 dark:text-sky-300">
              {isOverviewLoading ? "—" : formatNumber(awaiting)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
            <span className="flex items-center gap-2">
              <i className="fas fa-paper-plane text-indigo-500" />
              Released
            </span>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
              {isOverviewLoading ? "—" : `${formatNumber(release.released)} / ${formatNumber(release.released + release.notReleased)}`}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
            <span className="flex items-center gap-2">
              <i className="fas fa-user-check text-blue-500" />
              Examiner submissions
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              {isOverviewLoading
                ? "—"
                : `${formatNumber(examinerSubmissions.submitted)} / ${formatNumber(examinerSubmissions.total)}`}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-100">
        <div className="text-xs uppercase tracking-[0.3em]">Highlights</div>
        <ul className="mt-3 space-y-3">
          {keyMessages.map((item, index) => (
            <li key={`${item.label}-${index}`} className="rounded-2xl bg-white/20 p-3 text-xs leading-relaxed dark:bg-white/10">
              <div className={`font-semibold uppercase tracking-[0.2em] ${item.tone}`}>{item.label}</div>
              <div className="mt-1 text-[13px]">{item.message}</div>
              {item.time && <div className="mt-1 text-[11px] text-blue-100/80">Updated {item.time}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
