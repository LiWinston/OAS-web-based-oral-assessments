"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAssignmentSessions } from "@/hooks/admin/results/useAssignmentSessions.js";

const readinessStyles = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40",
  idle: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/60",
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

const formatDateRange = (startISO, endISO, timezone) => {
  if (!startISO) return "Schedule pending";

  try {
    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : null;

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: timezone,
    });

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    const dateLabel = dateFormatter.format(start);
    const startLabel = timeFormatter.format(start);
    const endLabel = end ? timeFormatter.format(end) : null;

    if (endLabel) {
      return `${dateLabel} · ${startLabel} – ${endLabel}`;
    }

    return `${dateLabel} · ${startLabel}`;
  } catch (error) {
    return "Schedule pending";
  }
};

function SessionSkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200/60 dark:border-gray-800/70 bg-gray-100/80 dark:bg-gray-900/30 px-4 py-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-gray-300/70 dark:bg-gray-700/70" />
        <div className="h-3 w-32 rounded bg-gray-300/60 dark:bg-gray-700/60" />
      </div>
      <div className="h-9 w-28 rounded-lg bg-gray-300/70 dark:bg-gray-700/70" />
    </div>
  );
}

function SessionRow({ session, courseId, assignmentId }) {
  const sessionId = session?.sessionId ?? session?.id;
  const participantCount = session?.participantCount ?? session?.participants ?? 0;
  const venueName = session?.venue?.name ?? session?.venueName;
  const timezone = session?.timezone;
  const scheduleLabel = formatDateRange(session?.start, session?.end, timezone);
  const href =
    sessionId !== undefined && sessionId !== null
      ? `/admin/courses/${courseId}/assignments/${assignmentId}/results/sessions/${sessionId}`
      : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900/40 px-4 py-4 transition-all hover:border-blue-200/80 hover:shadow-md dark:hover:border-blue-600/60">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <i className="far fa-calendar text-blue-500" />
          {scheduleLabel}
        </span>
        {venueName && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            <i className="fas fa-map-marker-alt text-[10px]" />
            {venueName}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <i className="fas fa-users text-[10px]" />
          {participantCount} participant{participantCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1">
          <i className="fas fa-clock text-[10px]" />
          {timezone ? `Timezone: ${timezone}` : "Timezone pending"}
        </span>
        {href ? (
          <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-500">
            <Link href={href}>
              <i className="fas fa-door-open" />
              Open session
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            <i className="fas fa-lock" />
            Awaiting session ID
          </Button>
        )}
      </div>
    </div>
  );
}

function SessionsSection({ loading, error, sessions, courseId, assignmentId, onRetry, isFetching }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SessionSkeletonRow key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-700 bg-red-50/80 dark:bg-red-900/30 px-4 py-4 text-sm text-red-700 dark:text-red-200">
        <i className="fas fa-exclamation-triangle mt-1" aria-hidden="true" />
        <div className="space-y-2">
          <p>Failed to load sessions for this assignment.</p>
          <Button size="sm" onClick={onRetry} disabled={isFetching}>
            {isFetching && <i className="fas fa-spinner fa-spin mr-2" />}
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 px-6 py-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
          <i className="fas fa-calendar-plus" />
        </div>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">No sessions configured yet</h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Set up sessions in Assignment Configuration to start consolidating assessment results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionRow
          key={session?.sessionId ?? session?.id}
          session={session}
          courseId={courseId}
          assignmentId={assignmentId}
        />
      ))}
    </div>
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

  const sessions = sessionData?.items ?? [];
  const totalSessions = sessionData?.total ?? sessions.length ?? 0;

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
                {assignment?.description || "Monitor sessions, coordinate examiner submissions, and plan result releases."}
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
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Sessions</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalSessions} session{totalSessions === 1 ? "" : "s"} configured for this assignment.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching}>
              {isFetching && <i className="fas fa-spinner fa-spin mr-2" />}
              Refresh
            </Button>
          </div>

          <SessionsSection
            loading={isLoading && !sessionData}
            error={isError}
            sessions={sessions}
            courseId={subjectId}
            assignmentId={assignmentId}
            onRetry={refetch}
            isFetching={isFetching}
          />
        </div>
      </div>
    </div>
  );
}

export default ResultsHubAssignmentRow;
