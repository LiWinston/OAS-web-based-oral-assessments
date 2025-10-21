"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import ScoreSummaryPanel from "@/components/admin/results/ScoreSummaryPanel.jsx";
import ExaminersRubricTabs from "@/components/admin/results/ExaminersRubricTabs.jsx";
import { useGroupResultDetail } from "@/hooks/admin/useAdminResults.js";
import { formatDateRangeWithTimezone } from "@/lib/datetime.js";
import { ReleaseStatusBadge } from "@/components/admin/results/ReleaseStatusBadge.jsx";
import ReleaseDialog from "@/components/admin/results/ReleaseDialog.jsx";
import ReviewDialog from "@/components/admin/results/ReviewDialog.jsx";
import { Button } from "@/components/ui/button";
import useResultActions from "@/hooks/admin/results/useResultActions.js";

const formatMemberScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return numeric.toFixed(2);
};

export default function GroupResultDetailPage() {
  const params = useParams();
  const search = useSearchParams();
  const { courseId, assignmentId, groupId } = params;
  const sessionId = search.get("sessionId");

  const { data, isLoading, isError, refetch, isFetching } = useGroupResultDetail(
    courseId,
    assignmentId,
    groupId
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

  const {
    examinerSummary,
    releaseSubmissionIds,
    releaseDialogOpen,
    setReleaseDialogOpen,
    releaseMutation,
    reviewDialog,
    openReviewDialog,
    closeReviewDialog,
    reviewMutation,
    handleReviewConfirm,
    handleReleaseConfirm,
  } = useResultActions({
    subjectId: courseId,
    assignmentId,
    participantType: "GROUP",
    participantId: groupId,
    detail: data,
    refetch,
  });

  const canRelease = (examinerSummary?.allSubmitted ?? false) && releaseSubmissionIds.length > 0;
  const activeReviewExaminer = reviewDialog.examiner;

  const renderExaminerActions = useCallback(
    (examiner) => {
      if (!examiner) return null;
      const status = (examiner.assessmentStatus || '').toUpperCase();
      if (status !== 'SUBMITTED') {
        if (status === 'REOPENED') {
          return (
            <span className="text-xs text-amber-600 dark:text-amber-300">
              Awaiting resubmission
            </span>
          );
        }
        return null;
      }

      const isProcessing =
        reviewMutation.isPending &&
        activeReviewExaminer &&
        activeReviewExaminer.examinerId === examiner.examinerId;

      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openReviewDialog(examiner)}
          disabled={reviewMutation.isPending}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2" />
              Requesting…
            </>
          ) : (
            <>
              <i className="fas fa-undo mr-2" />
              Request rework
            </>
          )}
        </Button>
      );
    },
    [openReviewDialog, reviewMutation.isPending, activeReviewExaminer]
  );

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
          <span className="font-semibold text-blue-600">Group {data?.participant?.groupName ?? groupId}</span>
        </nav>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-blue-100/80">Group result detail</div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <i className="fas fa-users" />
              {data?.participant?.groupName ?? `Group ${groupId}`}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-blue-100/80">
              <span className="inline-flex items-center gap-2">
                <i className="fas fa-book" />
                {data?.assignment?.name ?? `Assignment ${assignmentId}`}
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="fas fa-id-badge" />
                Session {data?.session?.id ?? "–"}
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
            Failed to load group detail. Please try again.
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
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Group detail unavailable</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This group may have been removed or you might not have access to it.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <ScoreSummaryPanel
            finalScore={data?.finalScore}
            releaseStatus={releaseStatus}
            onReleaseClick={() => setReleaseDialogOpen(true)}
            canRelease={canRelease}
            isReleasePending={releaseMutation.isPending}
            actions={
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {examinerSummary.submitted ?? 0}/{examinerSummary.total ?? 0} examiners submitted
              </div>
            }
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The group final score above is the combined average across all examiners; the scores in the member list show each student’s own final average within this group assessment.
          </p>

          {Array.isArray(data?.participant?.members) && data.participant.members.length > 0 && (
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <i className="fas fa-user-friends" /> Group members
              </h2>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300">
                {data.participant.members.map((member, index) => (
                  <span
                    key={`${member.studentId ?? "member"}-${index}`}
                    className="inline-flex items-center gap-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1"
                  >
                    <span className="inline-flex items-center gap-2">
                      <i className="fas fa-user" />
                      {member.name || `Student ${member.studentId}`}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Final: {formatMemberScore(member.finalScore)}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          )}

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

            <ExaminersRubricTabs
              rubricSnapshot={data.rubricSnapshot}
              examiners={data.examiners}
              participant={data.participant}
              students={data.students}
              renderExaminerActions={renderExaminerActions}
            />
          </section>
        </div>
      )}

      <ReleaseDialog
        open={releaseDialogOpen}
        onOpenChange={setReleaseDialogOpen}
        onConfirm={handleReleaseConfirm}
        isSubmitting={releaseMutation.isPending}
        hasSubmittedExaminers={examinerSummary.hasSubmitted}
      />

      <ReviewDialog
        open={reviewDialog.open}
        examiner={reviewDialog.examiner}
        onOpenChange={(next) => {
          if (!next) closeReviewDialog();
        }}
        onConfirm={handleReviewConfirm}
        isSubmitting={reviewMutation.isPending}
      />
    </div>
  );
}
