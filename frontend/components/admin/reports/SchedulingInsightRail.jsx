'use client';

import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';

const fallbackAssignments = [];

const formatDate = (value) => {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  } catch (error) {
    return value;
  }
};

export default function SchedulingInsightRail({
  assignments,
  selectedAssignmentId,
  onSelectAssignment,
  summary,
  meta,
  publishStatus,
  lastRefreshedAt,
  onRefresh,
  insights,
}) {
  const assignmentOptions = assignments || fallbackAssignments;
  const hasAssignments = assignmentOptions.length > 0;

  const windowRange = useMemo(() => {
    if (!meta?.windowStart && !meta?.windowEnd) return '';
    const start = formatDate(meta?.windowStart);
    const end = formatDate(meta?.windowEnd);
    if (start && end) return `${start} – ${end}`;
    return start || end;
  }, [meta?.windowStart, meta?.windowEnd]);

  const refreshedLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const highlightedInsights = insights && insights.length > 0
    ? insights
    : [
        publishStatus?.examiners
          ? 'Examiner view is live for this assignment.'
          : 'Examiner view is not yet published.',
        publishStatus?.students
          ? 'Students can already see published sessions.'
          : 'Student schedule is hidden until you publish.',
      ];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Assignment</div>
        {hasAssignments ? (
          <div className="mt-3">
            <Select value={selectedAssignmentId ? String(selectedAssignmentId) : ''} onValueChange={onSelectAssignment}>
              <SelectTrigger className="w-full justify-between">
                <SelectValue placeholder="Select assignment" />
              </SelectTrigger>
              <SelectContent className="min-w-[220px]">
                {assignmentOptions.map((assignment) => (
                  <SelectItem key={assignment.id} value={String(assignment.id)}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{assignment.name || assignment.assignmentName}</span>
                      <span className="text-xs text-gray-500">
                        {assignment.courseCode || assignment.course?.code} · {assignment.courseName || assignment.course?.name}
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
        {meta && (
          <div className="mt-4 space-y-2 rounded-2xl bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
            {meta.courseName && (
              <div className="flex items-center gap-2">
                <i className="fas fa-book-open text-gray-400" />
                <span>{meta.courseName}</span>
              </div>
            )}
            {windowRange && (
              <div className="flex items-center gap-2">
                <i className="fas fa-calendar-week text-gray-400" />
                <span>{windowRange}</span>
              </div>
            )}
            {meta.timezone && (
              <div className="flex items-center gap-2">
                <i className="fas fa-globe text-gray-400" />
                <span>{meta.timezone}</span>
              </div>
            )}
          </div>
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
        <div className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{refreshedLabel}</div>
        <div className="mt-4 grid gap-3">
          <InsightMetric
            icon="fa-user-friends"
            label="Examiners required"
            value={summary?.totalRequiredExaminers ?? 0}
            tone="text-blue-600"
          />
          <InsightMetric
            icon="fa-user-check"
            label="Examiners assigned"
            value={summary?.totalAssignedExaminers ?? 0}
            tone="text-emerald-600"
          />
          <InsightMetric
            icon="fa-chair"
            label="Sessions today"
            value={summary?.totalSessions ?? 0}
            tone="text-indigo-600"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-100">
        <div className="text-xs uppercase tracking-[0.3em]">Highlights</div>
        <ul className="mt-2 space-y-2">
          {highlightedInsights.map((message, index) => (
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

function InsightMetric({ icon, label, value, tone }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
      <span className="flex items-center gap-2">
        <i className={`fas ${icon}`} />
        {label}
      </span>
      <span className={`text-base font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

