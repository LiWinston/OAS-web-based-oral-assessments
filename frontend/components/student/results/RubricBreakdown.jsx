'use client';

import React, { Fragment } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { TrendingUp, Users, MessageSquare } from 'lucide-react';

// Canvas-style rubric breakdown: table with criterion, rating, points, and inline comments
export default function RubricBreakdown({ rubricData }) {
  const { rubricBreakdown } = rubricData || {};

  if (!rubricBreakdown?.criteria) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No rubric breakdown available
          </p>
        </CardContent>
      </Card>
    );
  }

  const normalize = (s) => (s || '').toString().trim().toLowerCase();

  const aggregatedLevelFor = (criterion) => {
    const levels = (criterion.examinerScores || []).map(s => normalize(s.level)).filter(Boolean);
    if (levels.length === 0) return null;
    const first = levels[0];
    const allSame = levels.every(l => l === first);
    return allSame ? (criterion.examinerScores[0]?.level || null) : 'Mixed';
  };

  const levelBadgeClass = (level) => {
    const v = normalize(level);
    if (v === 'outstanding' || v === 'excellent') return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
    if (v === 'very good') return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
    if (v === 'good') return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
    if (v === 'satisfactory') return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300';
    if (v === 'needs improvement') return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="space-y-4">
      {rubricBreakdown.aggregationMethod && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Multiple examiners — scores {rubricBreakdown.aggregationMethod}d for final grade
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Criterion</TableHead>
                <TableHead className="w-1/4">Rating</TableHead>
                <TableHead className="w-1/4 text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rubricBreakdown.criteria.map((criterion, idx) => {
                const aggregatedLevel = aggregatedLevelFor(criterion);
                const percentage = Math.round((criterion.earnedPoints / (criterion.maxPoints || 1)) * 100);
                const keyBase = String(criterion.criterionId ?? `c-${idx}`);
                return (
                  <Fragment key={keyBase}>
                    <TableRow>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{criterion.name}</span>
                          {criterion.description && (
                            <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{criterion.description}</span>
                          )}
                          {typeof criterion.weight === 'number' && (
                            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">Weight: {criterion.weight}%</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {aggregatedLevel ? (
                          <Badge className={`text-xs ${levelBadgeClass(aggregatedLevel)}`}>{aggregatedLevel}</Badge>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                        {criterion.examinerScores?.length > 1 && aggregatedLevel === 'Mixed' && (
                          <div className="text-xs text-gray-500 mt-1">Different examiner ratings</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">{criterion.earnedPoints}/{criterion.maxPoints}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </TableCell>
                    </TableRow>

                    {/* Examiner details row (Canvas often shows a detail beneath) */}
                    {criterion.examinerScores?.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="bg-gray-50 dark:bg-gray-800/60">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Examiner marks</span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2">
                            {criterion.examinerScores.map((s, i) => (
                              <div key={String(s.examinerId ?? i)} className="flex items-center justify-between p-2 border rounded-md dark:border-gray-700 bg-white dark:bg-gray-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                    {s.examinerName?.charAt(0) || 'E'}
                                  </div>
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900 dark:text-white">{s.examinerName}</div>
                                    {s.level && <div className="text-xs"><Badge className={`text-2xs ${levelBadgeClass(s.level)}`}>{s.level}</Badge></div>}
                                  </div>
                                </div>
                                <div className="text-right text-sm">
                                  <div className="font-semibold">{s.points}</div>
                                  <div className="text-xs text-gray-500">/{criterion.maxPoints}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Comments row */}
                    {criterion.comments?.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                            <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Feedback</span>
                          </div>
                          <div className="space-y-1">
                            {criterion.comments.map((c, i) => (
                              <div key={`${keyBase}-cmt-${i}`} className="text-sm text-blue-900 dark:text-blue-100">{c}</div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
            <TableCaption className="text-left">Rubric reflects assignment configuration; scores aggregated per course settings.</TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
