"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useAssessmentDetail,
  useReviewExaminer,
  useSetFinalScore,
  useReleaseAssessment
} from "@/hooks/admin/useAdminResults.js";
import ScoreSummaryPanel from "@/components/admin/results/ScoreSummaryPanel.jsx";
import ExaminerPanel from "@/components/admin/results/ExaminerPanel.jsx";
import ReviewDialog from "@/components/admin/results/ReviewDialog.jsx";
import FinalScoreEditor from "@/components/admin/results/FinalScoreEditor.jsx";
import ReleaseDialog from "@/components/admin/results/ReleaseDialog.jsx";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";

const MOCK_MODE = (process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'true') !== 'false';

const FALLBACK_COURSE = {
  courseCode: 'OAS101',
  courseName: 'Oral Assessment Sandbox',
  academicYear: '2025',
  semester: '1',
};

const FALLBACK_ASSIGNMENTS = {
  101: { name: 'Oral Exam 1', type: 'mixed' },
  102: { name: 'Technical Viva', type: 'individual' },
  103: { name: 'Team Demo', type: 'group' },
};

function toFrozenRubric(rubric) {
  if (!rubric) return { criteria: [] };
  const criteria = (rubric.criteria || []).map((c) => ({
    criterionId: c.criterionId,
    text: c.title || c.criterionId,
    weightPct: c.weightOrPoints ?? 0,
    appliesTo: 'BOTH',
    levels: (c.performanceLevels || []).map((pl) => ({
      levelId: pl.levelId,
      levelLabel: pl.label || pl.levelId,
      levelRange: { min: 0, max: Number(pl.value) || 0 },
      description: pl.description,
    })),
  }));
  return { rubricId: rubric?.rubricMetaInfo?.rubricId, version: 1, criteria };
}

function StatusChip({ releaseStatus, examiners }) {
  const hasReopened = (examiners || []).some((ex) => ex.assessmentStatus === 'REOPENED');
  const status = hasReopened ? 'Reopened' : (releaseStatus === 'RELEASED' ? 'Released' : 'Not Released');
  const cls = status === 'Reopened'
    ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
    : status === 'Released'
      ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
      : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}>{status}</span>;
}

function fmtRange(start, end) {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (!s || !e) return '—';
  const date = s.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const st = s.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const et = e.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  return `${date} • ${st} – ${et}`;
}

export default function AdminResultDetailPage() {
  const params = useParams();
  const { courseId, assignmentId, submissionId } = params;
  const subjectId = courseId;

  const { data, isLoading } = useAssessmentDetail(subjectId, assignmentId, submissionId);
  const reviewMutation = useReviewExaminer(subjectId, assignmentId, submissionId);
  const setFinalMutation = useSetFinalScore(subjectId, assignmentId, submissionId);
  const releaseMutation = useReleaseAssessment(subjectId, assignmentId, submissionId);

  const [reviewDialog, setReviewDialog] = useState(null);
  const [finalScoreDialog, setFinalScoreDialog] = useState(false);
  const [releaseDialog, setReleaseDialog] = useState(false);
  const [course, setCourse] = useState(null);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    let active = true;
    if (MOCK_MODE) {
      setCourse(FALLBACK_COURSE);
      const fallback = FALLBACK_ASSIGNMENTS[Number(assignmentId)] || { name: `Assignment ${assignmentId}`, type: 'individual' };
      setAssignment(fallback);
      return () => { active = false; };
    }
    Promise.all([
      courseService.getCourse(courseId).catch(() => null),
      assignmentService.getAssignmentById(assignmentId).catch(() => null),
    ]).then(([courseResp, assignmentResp]) => {
      if (!active) return;
      if (courseResp?.success) setCourse(courseResp.data);
      else if (courseResp) setCourse(courseResp);

      if (assignmentResp?.success !== undefined) setAssignment(assignmentResp?.data);
      else setAssignment(assignmentResp);
    });
    return () => { active = false; };
  }, [courseId, assignmentId]);

  const title = data?.assessment?.student?.name || data?.assessment?.group?.name || `Submission ${submissionId}`;
  const time = fmtRange(data?.session?.start, data?.session?.end);
  const computed = data?.computed || {};
  const frozen = toFrozenRubric(data?.rubric);
  const hasSubmittedExaminers = (data?.examiners || []).some((ex) => ex.assessmentStatus === 'SUBMITTED');

  const handleReviewRequest = async ({ reason }) => {
    if (!reviewDialog) return;
    try {
      await reviewMutation.mutateAsync({ examinerId: reviewDialog.examinerId, reason });
      setReviewDialog(null);
    } catch (e) {}
  };

  const handleFinalScoreUpdate = async (scoreData) => {
    try {
      await setFinalMutation.mutateAsync(scoreData);
      setFinalScoreDialog(false);
    } catch (e) {}
  };

  const handleRelease = async (releaseData) => {
    try {
      await releaseMutation.mutateAsync(releaseData);
      setReleaseDialog(false);
    } catch (e) {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-4" />
          <p className="text-sm text-gray-500">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300" aria-label="Breadcrumb">
          <Link href="/admin" className="font-semibold text-blue-600">OAS</Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin/courses" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Courses</Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link
            href={`/admin/courses/${courseId}/assignments`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {course?.courseName || `Course ${courseId}`}
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link
            href={`/admin/courses/${courseId}/assignments/${assignmentId}/results`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {assignment?.name || `Assignment ${assignmentId}`}
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="font-semibold text-blue-600">Assessment Detail</span>
        </nav>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">Course</div>
            <div className="text-lg font-semibold">{`${course?.courseCode || ''} ${course?.courseName || ''}`.trim() || `Course ${courseId}`}</div>
            <div className="text-xs text-blue-100/80">ID: {courseId}</div>
            {(course?.academicYear || course?.semester) && (
              <div className="text-xs text-blue-100/70 mt-1">
                <i className="fas fa-calendar mr-1" />
                {course?.academicYear || 'Academic Year'}{course?.semester ? ` • Semester ${course.semester}` : ''}
              </div>
            )}
          </div>
          <div className="hidden lg:block h-12 w-px bg-white/30" />
          <div>
            <div className="text-xs font-medium text-blue-100 uppercase tracking-wide">Assignment</div>
            <div className="text-lg font-semibold">{assignment?.name || `Assignment ${assignmentId}`}</div>
            <div className="text-xs text-blue-100/80">ID: {assignmentId}</div>
          </div>
          {assignment?.type && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wide">
              {assignment.type}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {data?.assessment?.group ? (
                  <><i className="fas fa-users text-gray-400 mr-2" />{title}</>
                ) : (
                  <><i className="fas fa-user text-gray-400 mr-2" />{title}</>
                )}
              </h1>
              <StatusChip releaseStatus={data?.releaseStatus} examiners={data?.examiners} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <i className="far fa-calendar mr-1" />
              {time}
            </div>
            {data?.session?.venue && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <i className="fas fa-map-marker-alt mr-1" />
                {data.session.venue.name}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Submission ID: {submissionId}</div>
          </div>
        </div>
      </div>

      <ScoreSummaryPanel
        computed={computed}
        releaseStatus={data?.releaseStatus}
        onOverrideClick={() => setFinalScoreDialog(true)}
        onReleaseClick={() => setReleaseDialog(true)}
        canRelease={hasSubmittedExaminers}
        isOverridePending={setFinalMutation.isPending}
        isReleasePending={releaseMutation.isPending}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Examiner Assessments</h2>
          <span className="text-sm text-gray-500">
            {data?.examiners?.length || 0} examiner{data?.examiners?.length !== 1 ? 's' : ''}
          </span>
        </div>

        {!data?.examiners || data.examiners.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <i className="fas fa-user-slash text-3xl text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No examiner assessments yet</p>
          </div>
        ) : (
          data.examiners.map((examiner) => (
            <ExaminerPanel
              key={examiner.examinerId}
              examiner={examiner}
              rubricFrozen={frozen}
              onReview={(ex) => setReviewDialog(ex)}
            />
          ))
        )}
      </div>

      <ReviewDialog
        open={!!reviewDialog}
        examiner={reviewDialog}
        onOpenChange={(open) => {
          if (!open) setReviewDialog(null);
        }}
        onConfirm={handleReviewRequest}
        isSubmitting={reviewMutation.isPending}
      />

      <FinalScoreEditor
        open={finalScoreDialog}
        onOpenChange={(open) => setFinalScoreDialog(open)}
        initialValue={computed?.manualOverride?.valuePct1dp ?? computed?.effectiveFinalScorePct1dp}
        onSubmit={handleFinalScoreUpdate}
        isSubmitting={setFinalMutation.isPending}
      />

      <ReleaseDialog
        open={releaseDialog}
        onOpenChange={(open) => setReleaseDialog(open)}
        hasSubmittedExaminers={hasSubmittedExaminers}
        onConfirm={handleRelease}
        isSubmitting={releaseMutation.isPending}
      />
    </div>
  );
}
