'use client';

import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Users, User, Eye, BookOpen } from 'lucide-react';

/**
 * Individual Result Card Component
 * Displays a single assignment result in the overview
 */
export default function ResultCard({ assignment, onViewDetails }) {
  const { result } = assignment;
  
  const computePct = () => {
    if (typeof result?.percentage === 'number') return Math.round(result.percentage);
    if (result?.maxPoints) return Math.round((result.totalPoints / result.maxPoints) * 100);
    return 0;
  };

  const gradeBand = (pct) => {
    if (pct >= 80) return 'H1';
    if (pct >= 50) return 'P';
    return 'F';
  };

  const gradeBadgeClass = (band) => {
    switch (band) {
      case 'H1':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'P':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'F':
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const typeChipClass = (type) => {
    switch (type) {
      case 'GROUP':
        return 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700';
      case 'MIXED':
        return 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700';
      case 'INDIVIDUAL':
      default:
        return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700';
    }
  };

  const pct = computePct();
  const band = gradeBand(pct);

  return (
    <Card className="bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow duration-200 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* top accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
      <CardContent className="p-3">
        {/* Header with Course and Assignment Info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                {assignment.courseCode}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeChipClass(assignment.assessmentType)}`}>
                {assignment.assessmentType === 'GROUP' && <Users className="w-3 h-3 mr-1" />}
                {assignment.assessmentType === 'INDIVIDUAL' && <User className="w-3 h-3 mr-1" />}
                {assignment.assessmentType === 'MIXED' && <BookOpen className="w-3 h-3 mr-1" />}
                {assignment.assessmentType}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5 leading-snug">
              {assignment.assignmentName}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {assignment.courseName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              {assignment.semester}
            </p>
            {result.entity?.type === 'GROUP' && (
              <div className="mt-1 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Group: {result.entity.groupName}</span>
              </div>
            )}
          </div>
          
          {/* Grade Badge */}
          <div className="text-right">
            <Badge className={`text-xs font-bold px-2 py-0.5 ${gradeBadgeClass(band)}`}>{band}</Badge>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
              {result.totalPoints}/{result.maxPoints} ({pct}%)
            </p>
          </div>
        </div>
        {/* Examiner Information */}
        {result.examinerCount && (
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {result.examinerCount} examiner{result.examinerCount !== 1 ? 's' : ''}
            {result.aggregationMethod && ` • ${result.aggregationMethod} aggregation`}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end mt-2">
          <Button 
            onClick={() => onViewDetails(assignment)}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-1.5 h-8"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
