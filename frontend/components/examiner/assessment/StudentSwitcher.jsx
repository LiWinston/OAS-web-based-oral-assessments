'use client';

import { Card, CardContent } from '../../ui/card';

export default function StudentSwitcher({
  individuals = [],
  selectedStudent,
  setSelectedStudent,
  perStudentMissing = [],
  isAllStudentsComplete,
}) {
  return (
    <Card className="dashboard-card">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Student:</span>
          <select
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            value={selectedStudent || ''}
            onChange={(e) => setSelectedStudent(parseInt(e.target.value))}
          >
            {individuals.map((student) => {
              const ps = perStudentMissing.find((s) => s.studentId === student.studentId);
              const filled = ps ? ps.required - ps.missing : 0;
              const req = ps ? ps.required : 0;
              return (
                <option key={student.studentId} value={student.studentId}>
                  {student.name} (ID: {student.studentId}) — {filled}/{req} complete
                </option>
              );
            })}
          </select>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quick scan (click to switch):</div>
          <div className="flex flex-wrap gap-2">
            {individuals.map((student) => {
              const ps = perStudentMissing.find((s) => s.studentId === student.studentId);
              const filled = ps ? ps.required - ps.missing : 0;
              const req = ps ? ps.required : 0;
              const isComplete = ps ? ps.missing === 0 : false;
              const color = isComplete
                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
                : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800';
              const ring = selectedStudent === student.studentId ? 'ring-2 ring-blue-400 dark:ring-blue-500' : '';
              return (
                <button
                  key={student.studentId}
                  type="button"
                  onClick={() => setSelectedStudent(student.studentId)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${color} ${ring}`}
                  title={`${student.name}: ${filled}/${req} complete`}
                >
                  {student.name.split(' ')[0]} • {filled}/{req}
                </button>
              );
            })}
          </div>
        </div>
        {isAllStudentsComplete && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center">
            <i className="fas fa-check-circle text-green-600 dark:text-green-300 mr-2"></i>
            <span className="text-sm text-green-800 dark:text-green-200">All students' individual criteria are complete</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

