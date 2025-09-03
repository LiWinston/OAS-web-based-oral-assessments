'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';

export default function HeaderStatusBar({
  isDraft,
  assignmentType,
  validation,
  selectedStudent,
  autoSaveStatus = 'saved',
}) {
  const [timerRunning, setTimerRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef(null);

  useEffect(() => {
    if (timerRunning) {
      timerInterval.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [timerRunning]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Assessment in Progress</h1>
        <Badge
          variant={isDraft ? 'outline' : 'default'}
          className={isDraft ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800' : ''}
        >
          {isDraft ? 'Draft' : 'In Progress'}
        </Badge>
        {assignmentType && (
          <div className="flex items-center gap-2">
            {(assignmentType === 'group' || assignmentType === 'mixed') && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                Group {Math.max(0, (validation.groupRequired - validation.groupMissing))}/{validation.groupRequired}
              </Badge>
            )}
            {(assignmentType === 'individual' || assignmentType === 'mixed') && selectedStudent && (() => {
              const ps = validation.perStudentMissing?.find((s) => s.studentId === selectedStudent);
              const filled = ps ? ps.required - ps.missing : 0;
              const req = ps ? ps.required : 0;
              return (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                  Student {filled}/{req}
                </Badge>
              );
            })()}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4 mt-4 md:mt-0">
        {/* Timer */}
        <div className="flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700">
          <span className="text-2xl font-mono font-bold">{formatTime(timer)}</span>
          <div className="flex ml-3 space-x-1">
            <Button size="sm" variant="ghost" onClick={() => setTimerRunning(!timerRunning)}>
              <i className={cn('fas', timerRunning ? 'fa-pause' : 'fa-play')}></i>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setTimer(0);
                setTimerRunning(false);
              }}
            >
              <i className="fas fa-redo-alt"></i>
            </Button>
          </div>
        </div>

        {/* Auto-save status */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          {autoSaveStatus === 'saving' ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></div>
              Saving...
            </>
          ) : autoSaveStatus === 'saved' ? (
            <>
              <i className="fas fa-check-circle text-green-500 mr-2"></i>
              All changes saved
            </>
          ) : (
            <>
              <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
              Save failed
            </>
          )}
        </div>
      </div>
    </div>
  );
}

