'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';

function filterCriteria(criteria = [], target) {
  if (!criteria || criteria.length === 0) return [];
  if (!target) return criteria;
  return criteria.filter(c => {
    const a = c.appliesTo || 'BOTH';
    if (target === 'GROUP') return a === 'GROUP' || a === 'BOTH';
    if (target === 'INDIVIDUAL') return a === 'INDIVIDUAL' || a === 'BOTH';
    return true;
  });
}

function weightedScore(criteria = [], ratings = {}) {
  return criteria.reduce((sum, c) => {
    const r = ratings[c.criterionId];
    if (!r || typeof r.points !== 'number') return sum;
    return sum + (r.points * (c.weight || 0) / 100);
  }, 0);
}

function countFilled(criteria = [], ratings = {}) {
  const ids = new Set(criteria.map(c => c.criterionId));
  const filled = Object.keys(ratings).filter(k => ids.has(k));
  return { filled: filled.length, required: ids.size };
}

export default function TotalsPanel({
  assignment,
  criteria = [],
  groupRatings = {},
  individualRatings = {},
  individuals = [],
}) {
  const type = assignment?.type || 'individual';
  const groupWeight = type === 'mixed' ? (assignment?.groupWeight ?? 0.5) : 1;
  const individualWeight = type === 'mixed' ? (assignment?.individualWeight ?? 0.5) : 1;

  const groupCriteria = filterCriteria(criteria, 'GROUP');
  const individualCriteria = filterCriteria(criteria, 'INDIVIDUAL');

  const groupScore = weightedScore(groupCriteria, groupRatings);
  const groupFill = countFilled(groupCriteria, groupRatings);

  const rows = individuals.map(stu => {
    const ratings = individualRatings[stu.studentId] || {};
    const indScore = weightedScore(individualCriteria, ratings);
    const indFill = countFilled(individualCriteria, ratings);
    const final = type === 'mixed'
      ? (groupScore * groupWeight + indScore * individualWeight)
      : (type === 'group' ? groupScore : indScore);
    return {
      studentId: stu.studentId,
      name: stu.name,
      indScore,
      indFill,
      final,
    };
  });

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>
          <i className="fas fa-chart-pie text-blue-600 mr-2"></i>
          Scores Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(type === 'group' || type === 'mixed') && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Group score (criteria: {groupFill.filled}/{groupFill.required})
            </div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {groupScore.toFixed(2)} / 100
            </div>
          </div>
        )}

        {(type === 'individual' || type === 'mixed') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Per-student totals</div>
              {type === 'mixed' && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Weighting: Group {Math.round(groupWeight * 100)}% • Individual {Math.round(individualWeight * 100)}%
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                    <th className="py-2 pr-3">Student</th>
                    {type !== 'group' && <th className="py-2 pr-3">Individual</th>}
                    {type === 'mixed' && <th className="py-2 pr-3">Final</th>}
                    {type === 'individual' && <th className="py-2 pr-3">Total</th>}
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.studentId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">ID: {r.studentId}</div>
                      </td>
                      {type !== 'group' && (
                        <td className="py-2 pr-3">
                          <span className="font-semibold">{r.indScore.toFixed(2)}</span>
                          <span className="text-gray-500 dark:text-gray-400"> / 100</span>
                        </td>
                      )}
                      {type === 'mixed' && (
                        <td className="py-2 pr-3">
                          <span className="font-semibold">{r.final.toFixed(2)}</span>
                          <span className="text-gray-500 dark:text-gray-400"> / 100</span>
                        </td>
                      )}
                      {type === 'individual' && (
                        <td className="py-2 pr-3">
                          <span className="font-semibold">{r.indScore.toFixed(2)}</span>
                          <span className="text-gray-500 dark:text-gray-400"> / 100</span>
                        </td>
                      )}
                      <td className="py-2">
                        {r.indFill && r.indFill.required > 0 ? (
                          <Badge variant="outline" className={(r.indFill.filled === r.indFill.required)
                            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
                            : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800'}>
                            {r.indFill.filled}/{r.indFill.required} criteria
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

