'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Users, User, BookOpen, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function ResultsTable({ results = [], onViewDetails }) {
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return '—';
    }
  };

  const gradeBand = (percentage) => {
    if (percentage >= 80) return 'H1';
    if (percentage >= 50) return 'P';
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

  const typeBadge = (type) => {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium';
    const styles = {
      INDIVIDUAL: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300',
      GROUP: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300',
      MIXED: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300',
    };
    return (
      <span className={`${base} ${styles[type] || 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
        {type === 'GROUP' && <Users className="w-3 h-3 mr-1" />}
        {type === 'INDIVIDUAL' && <User className="w-3 h-3 mr-1" />}
        {type === 'MIXED' && <BookOpen className="w-3 h-3 mr-1" />}
        {type}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Grade</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((r, idx) => (
            <TableRow key={r.assignmentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300">
              <TableCell className="font-medium">{r.courseCode}</TableCell>
              <TableCell>
                <div className="font-medium text-gray-900 dark:text-white">{r.assignmentName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{r.courseName}</div>
              </TableCell>
              <TableCell>{r.semester}</TableCell>
              <TableCell>{typeBadge(r.assessmentType)}</TableCell>
              <TableCell className="text-right">
                {(() => {
                  const pct = Math.round(
                    typeof r.result?.percentage === 'number'
                      ? r.result.percentage
                      : r.result?.maxPoints
                      ? (r.result.totalPoints / r.result.maxPoints) * 100
                      : 0
                  );
                  const band = gradeBand(pct);
                  return (
                    <Badge className={`text-xs font-semibold px-2 py-0.5 ${gradeBadgeClass(band)}`}>{band}</Badge>
                  );
                })()}
              </TableCell>
              <TableCell className="text-right">
                {(() => {
                  const pct = Math.round(
                    typeof r.result?.percentage === 'number'
                      ? r.result.percentage
                      : r.result?.maxPoints
                      ? (r.result.totalPoints / r.result.maxPoints) * 100
                      : 0
                  );
                  return (
                    <span>
                      {r.result.totalPoints}/{r.result.maxPoints}({pct}%)
                    </span>
                  );
                })()}
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => onViewDetails(r)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all inline-flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1" /> View
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
