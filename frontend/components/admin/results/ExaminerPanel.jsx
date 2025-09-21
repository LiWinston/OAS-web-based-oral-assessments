"use client";

import { Button } from "@/components/ui/button";
import RubricSnapshot from "@/components/examiner/results/RubricSnapshot.jsx";

const STATUS_META = {
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  REOPENED: { label: 'Reopened', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  DRAFT: { label: 'Draft', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const statusChip = (status) => {
  const meta = STATUS_META[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${meta.className}`}>{meta.label}</span>;
};

export default function ExaminerPanel({ examiner, rubricFrozen, onReview }) {
  const canReview = examiner.assessmentStatus === 'SUBMITTED';
  return (
    <div className="dashboard-card p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <i className="fas fa-user-tie text-gray-400" />
            {examiner.name}
            {statusChip(examiner.assessmentStatus)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {examiner.submittedAt ? `Submitted ${new Date(examiner.submittedAt).toLocaleString()}` : 'Not yet submitted'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {typeof examiner.examinerScorePct1dp === 'number' && (
            <div className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-gray-100">Score:</span> {examiner.examinerScorePct1dp.toFixed(1)}%</div>
          )}
          <Button variant="outline" disabled={!canReview} onClick={() => onReview?.(examiner)}>
            <i className="fas fa-rotate-left mr-2" /> Review
          </Button>
        </div>
      </div>

      <RubricSnapshot title={null} rubricFrozen={rubricFrozen} items={examiner.items} />

      {(examiner.overallFeedback || examiner.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examiner.overallFeedback && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Student feedback</div>
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{examiner.overallFeedback}</div>
            </div>
          )}
          {examiner.notes && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Coordinator notes</div>
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{examiner.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
