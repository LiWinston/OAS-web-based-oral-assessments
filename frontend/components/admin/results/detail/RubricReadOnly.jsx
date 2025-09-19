"use client";

import RubricTable from '@/components/examiner/assessment/RubricTable';
import { Card } from '@/components/ui/card';

function buildCriteriaFromSubmissions(submissions = []) {
  // Derive minimal criteria list from items across submissions
  const byId = new Map();
  (submissions || []).forEach((s) => {
    (s.items || []).forEach((it) => {
      if (!byId.has(it.criterionId)) {
        byId.set(it.criterionId, {
          criterionId: it.criterionId,
          description: `Criterion ${it.criterionId}`,
          weight: 0, // unknown in admin view; for display only
          appliesTo: 'BOTH',
          levels: [
            { levelId: 'L1', levelLabel: 'Level 1', levelRange: { min: 0, max: 50 } },
            { levelId: 'L2', levelLabel: 'Level 2', levelRange: { min: 51, max: 75 } },
            { levelId: 'L3', levelLabel: 'Level 3', levelRange: { min: 76, max: 100 } },
          ],
        });
      }
    });
  });
  return Array.from(byId.values());
}

function buildSelectedRatingsFromSubmission(submission = {}) {
  const selected = {};
  (submission.items || []).forEach((it) => {
    selected[it.criterionId] = {
      levelId: it.levelId,
      points: it.points ?? 0,
      minPoints: 0,
      maxPoints: 100,
    };
  });
  return selected;
}

export default function RubricReadOnly({ submissions = [], assignment }) {
  const criteria = buildCriteriaFromSubmissions(submissions);

  if (!submissions?.length) {
    return <Card className="p-6 text-sm text-gray-600 dark:text-gray-300">No submissions to display.</Card>;
  }

  return (
    <div className="space-y-6">
      {submissions.map((s) => (
        <Card key={s.examinerId} className="p-4">
          <div className="font-medium mb-3">{s.examinerName || `Examiner ${s.examinerId}`}</div>
          <RubricTable
            criteria={criteria}
            selectedRatings={buildSelectedRatingsFromSubmission(s)}
            disabled={true}
            assessmentType={assignment?.type?.toUpperCase?.() || 'INDIVIDUAL'}
            showTotals={true}
          />
        </Card>
      ))}
    </div>
  );
}

