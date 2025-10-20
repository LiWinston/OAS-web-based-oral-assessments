"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import ScoreSummaryPanel from "@/components/admin/results/ScoreSummaryPanel.jsx";
import ExaminerPanel from "@/components/admin/results/ExaminerPanel.jsx";
import { useIndividualResultDetail } from "@/hooks/admin/useAdminResults.js";
import { formatDateRangeWithTimezone } from "@/lib/datetime.js";
import { ReleaseStatusBadge } from "@/components/admin/results/ReleaseStatusBadge.jsx";

export default function IndividualResultDetailPage() {
  const params = useParams();
  const search = useSearchParams();
  const { courseId, assignmentId, studentId } = params;
  const sessionId = search.get("sessionId");

  const { data, isLoading, isError, refetch, isFetching } = useIndividualResultDetail(
    courseId,
    assignmentId,
    studentId
  );

  const backHref = useMemo(() => {
    if (sessionId) {
      return `/admin/courses/${courseId}/assignments/${assignmentId}/results/sessions/${sessionId}`;
    }
    return `/admin/courses/${courseId}/assignments/${assignmentId}/results`;
  }, [courseId, assignmentId, sessionId]);

  const sessionLabel = useMemo(() => {
    if (!data?.session) return "Session time pending";
    return formatDateRangeWithTimezone(data.session.start, data.session.end, data.session.timezone);
  }, [data?.session]);

  const venueLabel = data?.session?.venue?.name ?? "Venue pending";
  const releaseStatus = data?.participant?.releaseStatus ?? "NOT_RELEASED";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3">
        <nav
          className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
          aria-label="Breadcrumb"
        >
          <Link href="/admin" className="font-semibold text-blue-600">
            OAS
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin/results" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Results Hub
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link
            href={`/admin/courses/${courseId}/assignments/${assignmentId}/results`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Session list
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href={backHref} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Session detail
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="font-semibold text-blue-600">Student {data?.participant?.name ?? studentId}</span>
        </nav>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-blue-100/80">Individual result detail</div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <i className="fas fa-user" />
              {data?.participant?.name ?? `Student ${studentId}`}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-blue-100/80">
              <span className="inline-flex items-center gap-2">
                <i className="fas fa-book" />
                {data?.assignment?.name ?? `Assignment ${assignmentId}`}
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="fas fa-id-badge" />
                Student #{data?.participant?.studentNumber ?? studentId}
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="fas fa-map-marker-alt" />
                {venueLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-blue-100/90">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <i className="fas fa-clock" />
              {sessionLabel}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <ReleaseStatusBadge status={releaseStatus} />
            </div>
          </div>
        </div>
      </div>

      {isError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-700 bg-red-50/80 dark:bg-red-900/30 px-4 py-4 text-sm text-red-700 dark:text-red-200">
          <i className="fas fa-exclamation-triangle mt-1" aria-hidden="true" />
          <div>
            Failed to load individual detail. Please try again.
            <button
              type="button"
              className="ml-3 inline-flex items-center gap-1 text-blue-600 hover:text-blue-500"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <i className="fas fa-sync" /> Retry
            </button>
          </div>
        </div>
      )}

      {isLoading && !data ? (
        <div className="space-y-4">
          <div className="h-28 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-100/80 dark:bg-gray-900/30 animate-pulse" />
          <div className="h-48 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-100/80 dark:bg-gray-900/30 animate-pulse" />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
            <i className="fas fa-circle-question" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Student detail unavailable</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This student may have been removed or you might not have access to them.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <ScoreSummaryPanel
            finalScore={data?.finalScore}
            releaseStatus={releaseStatus}
          />

          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <i className="fas fa-id-card" /> Student information
            </h2>
            <dl className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex flex-wrap gap-2">
                <dt className="font-medium">Name:</dt>
                <dd>{data.participant.name ?? `Student ${studentId}`}</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="font-medium">Student number:</dt>
                <dd>{data.participant.studentNumber ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Examiner submissions</h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching && <i className="fas fa-spinner fa-spin" />}
                Refresh
              </button>
            </div>

            {(!data.examiners || data.examiners.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No examiner submissions yet.
              </div>
            ) : (
              <div className="space-y-4">
                {data.examiners.map((examiner) => (
                  <ExaminerPanel
                    key={examiner.examinerId ?? examiner.examinerName}
                    examiner={examiner}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
