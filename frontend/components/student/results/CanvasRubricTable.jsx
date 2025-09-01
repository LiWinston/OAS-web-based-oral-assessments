'use client';

import { Card, CardContent } from '../../ui/card';
import { TrendingUp } from 'lucide-react';
import CanvasRubricRow from './CanvasRubricRow';

export default function CanvasRubricTable({ rubricBreakdown, rubricScale, showExaminerDetails = true }) {
  const aggregation = rubricBreakdown?.aggregationMethod;
  const criteria = rubricBreakdown?.criteria || [];

  // Build map criterionId -> levels[] from rubricScale
  const levelMap = new Map(
    (rubricScale?.criteria || []).map((c) => [String(c.criterionId), c.levels || []])
  );

  if (!criteria.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500 dark:text-gray-400">No rubric breakdown available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {aggregation && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Multiple examiners — scores {aggregation}d for final grade</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky header for large lists */}
      <div className="hidden md:grid grid-cols-12 sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-700 rounded px-3 py-2">
        <div className="col-span-4 text-xs font-semibold text-gray-600 dark:text-gray-300">Criterion</div>
        <div className="col-span-6 text-xs font-semibold text-gray-600 dark:text-gray-300">Levels</div>
        <div className="col-span-2 text-xs font-semibold text-right text-gray-600 dark:text-gray-300">Points</div>
      </div>

      <div className="space-y-3">
        {criteria.map((criterion, i) => (
          <CanvasRubricRow
            key={String(criterion.criterionId ?? i)}
            criterion={criterion}
            levels={levelMap.get(String(criterion.criterionId)) || []}
            showExaminerDetails={showExaminerDetails}
          />
        ))}
      </div>
    </div>
  );
}
