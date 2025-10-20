"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAssignmentSessions } from "@/hooks/admin/results/useAssignmentSessions.js";

const readinessStyles = {
  active:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40",
  idle:
    "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/60",
};

const readinessIcon = (done) => (done ? "fa-check" : "fa-circle");

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

export function ResultsHubAssignmentRow({ courseId, assignment }) {
  const subjectId = courseId;
  const assignmentId = assignment?.id ?? assignment?.assignmentId;

  const {
    data: sessionData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAssignmentSessions(subjectId, assignmentId, {}, { enabled: Boolean(subjectId && assignmentId) });

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

  const totalSessions = sessionData?.total ?? sessionData?.items?.length ?? 0;

  const sessionStatusMessage = (() => {
    if (isLoading && !sessionData) return "Loading session data…";
    if (isError) return "Session data unavailable. Please refresh.";
    if (totalSessions === 0) return "No sessions configured yet.";
    return `${totalSessions} session${totalSessions === 1 ? "" : "s"} configured.`;
  })();

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900/40 shadow-sm transition-all duration-200 hover:shadow-xl">
      <div
        className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-sky-500 via-indigo-500 to-purple-500"
        aria-hidden="true"
      />
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
                {assignment?.description ||
                  "Track this assignment’s sessions and move into participant review from the dedicated results workflow."}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <i className="fas fa-id-badge" />
                  Assignment ID: {assignmentId || "—"}
                </span>
                {assignment?.courseCode && (
                  <span className="flex items-center gap-1">
                    <i className="fas fa-book" />
                    {assignment.courseCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ReadinessChip label="Rubric" active={rubricReady} />
            <ReadinessChip label="Timeslots" active={sessionsReady} />
            <ReadinessChip label="Results" active={resultsReleased} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Session overview</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{sessionStatusMessage}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching}>
                {isFetching && <i className="fas fa-spinner fa-spin mr-2" />}
                Refresh
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-500"
                disabled={isError}
              >
                <Link href={`/admin/courses/${subjectId}/assignments/${assignmentId}/results`}>
                  <i className="fas fa-door-open" />
                  Review sessions
                </Link>
              </Button>
            </div>
          </div>

          {!isError && (
            <div className="rounded-2xl border border-blue-200/80 dark:border-blue-700/60 bg-blue-50/70 dark:bg-blue-900/20 px-4 py-4 text-sm text-blue-900 dark:text-blue-100">
              The session list surfaces timing, venues, and readiness details so you can continue with participant review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsHubAssignmentRow;
