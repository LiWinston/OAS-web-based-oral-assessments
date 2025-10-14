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
  absentStudents = [],
}) {
  const weightBasis = assignment?.rubric?.weightBasis || 'percentage';
  const groupWeight = Number(assignment?.weights?.group ?? assignment?.groupWeight ?? 0) || 0;
  const individualWeight = Number(assignment?.weights?.individual ?? assignment?.individualWeight ?? 0) || 0;

  const groupCriteria = filterCriteria(criteria, 'GROUP');
  const individualCriteria = filterCriteria(criteria, 'INDIVIDUAL');

  const hasGroup = groupCriteria.length > 0;
  const hasIndividual = individualCriteria.length > 0;

  // Weighted contributions based on criterion.weight (points or percentage)
  const groupContribution = weightedScore(groupCriteria, groupRatings);
  const groupFill = countFilled(groupCriteria, groupRatings);

  const rows = individuals.map(stu => {
    const ratings = individualRatings[stu.studentId] || {};
    const indContribution = weightedScore(individualCriteria, ratings);
    const indFill = countFilled(individualCriteria, ratings);
    const isAbsent = Array.isArray(absentStudents) && absentStudents.includes(stu.studentId);

    let final;
    if (isAbsent) {
      final = 0;
    } else if (hasGroup && hasIndividual) {
      final = groupContribution + indContribution;
    } else if (hasGroup) {
      final = groupContribution;
    } else {
      final = indContribution;
    }

    return {
      studentId: stu.studentId,
      name: stu.name,
      groupScore: isAbsent ? 0 : groupContribution,
      indScore: isAbsent ? 0 : indContribution,
      indFill,
      final,
      isAbsent,
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
        {hasGroup && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Group score (criteria: {groupFill.filled}/{groupFill.required})
            </div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {groupContribution.toFixed(2)} {weightBasis === 'points' ? 'pts' : '%'}
            </div>
          </div>
        )}

        {hasIndividual && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Per-student totals</div>
              {hasGroup && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Weighting: {weightBasis === 'points'
                    ? `Group ${groupWeight} pts • Individual ${individualWeight} pts`
                    : `Group ${groupWeight}% • Individual ${individualWeight}%`}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                    <th className="py-2 pr-3">Student</th>
                    {hasGroup && <th className="py-2 pr-3">Group</th>}
                    {hasIndividual && <th className="py-2 pr-3">Individual</th>}
                    {hasGroup && hasIndividual && <th className="py-2 pr-3">Final</th>}
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
                      {hasGroup && (
                        <td className="py-2 pr-3">
                          <span className="font-semibold">{r.groupScore.toFixed(2)}</span>
                          <span className="text-gray-500 dark:text-gray-400"> {weightBasis === 'points' ? 'pts' : '%'}</span>
                        </td>
                      )}
                      {hasIndividual && (
                        <td className="py-2 pr-3">
                          <span className="font-semibold">{r.indScore.toFixed(2)}</span>
                          <span className="text-gray-500 dark:text-gray-400"> {weightBasis === 'points' ? 'pts' : '%'}</span>
                        </td>
                      )}
                      {hasGroup && hasIndividual && (
                        <td className="py-2 pr-3">
                          <span className="font-semibold">{r.final.toFixed(2)}</span>
                          <span className="text-gray-500 dark:text-gray-400"> {weightBasis === 'points' ? 'pts' : '%'}</span>
                        </td>
                      )}
                      <td className="py-2">
                        {r.isAbsent ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
                            Absent
                          </Badge>
                        ) : r.indFill && r.indFill.required > 0 ? (
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
