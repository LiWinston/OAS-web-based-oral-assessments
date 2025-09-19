"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAssessmentDetail } from "@/hooks/admin/useAdminResults.js";
import RubricSnapshot from "@/components/examiner/results/RubricSnapshot.jsx";

function toFrozenRubric(rubric) {
  if (!rubric) return { criteria: [] };
  // Convert API rubric {criteria: [{ performanceLevels: [{ value, label, description }] }]} to
  // frozen rubric shape expected by RubricSnapshot/RubricTable
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

function StatusChip({ assessmentStatus, releaseStatus }) {
  const status = assessmentStatus === 'REOPENED' ? 'Reopened' : (releaseStatus === 'RELEASED' ? 'Released' : 'Not Released');
  const cls = status === 'Reopened'
    ? 'bg-purple-100 text-purple-800 border-purple-200'
    : status === 'Released'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-amber-100 text-amber-800 border-amber-200';
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

  const title = data?.assessment?.student?.name || data?.assessment?.group?.name || `Submission ${submissionId}`;
  const time = fmtRange(data?.session?.start, data?.session?.end);
  const avg = data?.computed?.averageScorePct1dp;
  const fin = data?.computed?.effectiveFinalScorePct1dp;
  const badge = <StatusChip assessmentStatus={data?.assessmentStatus} releaseStatus={data?.releaseStatus} />;

  const frozen = toFrozenRubric(data?.rubric);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Link href={`/admin/courses/${courseId}/assignments/${assignmentId}/results`}>Results &amp; Marking</Link>
        <i className="fas fa-chevron-right text-xs" />
        <span>Assessment Detail</span>
      </div>

      {/* Header */}
      <div className="dashboard-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
              {badge}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{time}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Average</div>
            <div className="text-xl font-bold">{typeof avg === 'number' ? `${avg.toFixed(1)}%` : '—'}</div>
            <div className="text-xs text-gray-500 mt-2">Final</div>
            <div className="text-xl font-bold">{typeof fin === 'number' ? `${fin.toFixed(1)}%` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Examiners */}
      <div className="space-y-4">
        {isLoading && (
          <div className="dashboard-card p-5 text-sm text-gray-600">Loading…</div>
        )}
        {!isLoading && (data?.examiners || []).map((ex) => (
          <div key={ex.examinerId} className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <i className="fas fa-user-tie text-gray-500" /> {ex.name}
                <span className="text-xs text-gray-500">{ex.assessmentStatus}{ex.submittedAt ? ` • ${new Date(ex.submittedAt).toLocaleString()}` : ''}</span>
              </div>
              {typeof ex.examinerScorePct1dp === 'number' && (
                <div className="text-sm"><span className="text-gray-500">Score: </span><span className="font-semibold">{ex.examinerScorePct1dp.toFixed(1)}%</span></div>
              )}
            </div>
            <RubricSnapshot title={null} rubricFrozen={frozen} items={ex.items} />
            {(ex.overallFeedback || ex.notes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {ex.overallFeedback && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs text-gray-500 mb-1">Overall feedback</div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{ex.overallFeedback}</div>
                  </div>
                )}
                {ex.notes && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs text-gray-500 mb-1">Notes (admin-only)</div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{ex.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

