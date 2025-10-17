'use client';

import { useEffect, useMemo, useState } from 'react';
import { useExaminerLimits } from '@/hooks/useExaminerLimits.js';
import { useSessionConfig } from '@/hooks/useSessionConfig.js';
import { showError } from '@/lib/notifications.js';
import { courseAdminSessionService } from '@/services/courseAdminSessionService.js';

/**
 * ExaminerLimitsStep - Step 3 of the schedule wizard
 * Loads examiners and mutates limits via hook; validates capacity in real-time
 * 
 * @typedef {import('@/types/timeslot.js').Examiner} Examiner
 */

export default function ExaminerLimitsStep({
  assignmentId,
  totalSessions = 0,
  summary,
  onComplete,
  onPrevious
}) {
  const { data: sessionConfig } = useSessionConfig(assignmentId);
  const {
    data: serverExaminers,
    isLoading,
    updateLimits,
    isUpdating
  } = useExaminerLimits(assignmentId);

  const [examiners, setExaminers] = useState([]);
  const [computedTotalSessions, setComputedTotalSessions] = useState(null);
  const summaryTotalSessions = useMemo(() => summary?.totalSessions != null ? Number(summary.totalSessions) : null, [summary]);

  useEffect(() => {
    if (serverExaminers && serverExaminers.length) {
      setExaminers(serverExaminers.map(e => ({ ...e })));
    }
  }, [serverExaminers]);

  // Load total sessions to assign from backend to avoid fallback being 0
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!assignmentId) return;
      try {
        const res = await courseAdminSessionService.getSessions(assignmentId, {});
        const items = Array.isArray(res?.data) ? res.data : [];
        let count = 0;
        if (items.length && Object.prototype.hasOwnProperty.call(items[0], 'sessionCount')) {
          count = items.reduce((sum, s) => sum + (parseInt(s.sessionCount, 10) || 0), 0);
        } else {
          count = items.length;
        }
        if (!cancelled) setComputedTotalSessions(count);
      } catch (e) {
        // keep fallback; optionally show subtle error once
      }
    })();
    return () => { cancelled = true; };
  }, [assignmentId]);

  const sessionsToAssign = useMemo(() => {
    if (summaryTotalSessions != null) return summaryTotalSessions;
    return (computedTotalSessions != null ? computedTotalSessions : totalSessions) || 0;
  }, [summaryTotalSessions, computedTotalSessions, totalSessions]);

  const summaryRequiredCapacity = useMemo(() => summary?.totalRequiredExaminers != null ? Number(summary.totalRequiredExaminers) : null, [summary]);

  const perSession = useMemo(() => sessionConfig?.examinersPerSession || 2, [sessionConfig]);

  const neededCapacity = useMemo(() => {
    if (summaryRequiredCapacity != null) return summaryRequiredCapacity;
    return sessionsToAssign * perSession;
  }, [summaryRequiredCapacity, sessionsToAssign, perSession]);

  const totalCapacity = useMemo(() => {
    return (examiners || []).reduce((sum, ex) => sum + (parseInt(ex.maxSessions, 10) || 0), 0);
  }, [examiners]);

  const toInt = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.floor(value) : fallback;
    }
    if (typeof value === 'string') {
      if (!value.trim()) return fallback;
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };

  const limitViolations = useMemo(() => {
    return (examiners || []).filter((examiner) => {
      const assignments = toInt(examiner.assignments, 0);
      const maxSessions = toInt(examiner.maxSessions, assignments);
      return maxSessions < assignments;
    });
  }, [examiners]);

  const capacityValid = totalCapacity >= neededCapacity;
  const capacityErrors = [];
  if (!capacityValid) {
    capacityErrors.push(`Required capacity ${neededCapacity} exceeds total examiner capacity ${totalCapacity}`);
  }
  limitViolations.forEach((examiner) => {
    const assignments = toInt(examiner.assignments, 0);
    capacityErrors.push(
      `${examiner.name || 'Examiner'} has ${assignments} current assignment${assignments === 1 ? '' : 's'}; limit must be at least this value.`
    );
  });
  const capacityWarnings = [];
  const canProceed = capacityValid && limitViolations.length === 0;

  const handleExaminerLimitChange = (examinerId, newLimit) => {
    setExaminers(prev =>
      prev.map(ex => {
        if (ex.id !== examinerId) return ex;
        const assignments = toInt(ex.assignments, 0);
        const parsed = toInt(newLimit, assignments);
        const next = Math.max(assignments, parsed);
        return { ...ex, maxSessions: next };
      })
    );
  };

  const handleCompleteSetup = () => {
    if (!canProceed) {
      showError('Cannot complete setup: insufficient examiner capacity or validation errors');
      return;
    }

    // Save current limits and complete setup
    const finalLimits = examiners.map(examiner => ({
      examinerId: examiner.id,
      maxSessions: examiner.maxSessions
    }));

    updateLimits(finalLimits, {
      onSuccess: () => {
        onComplete?.();
      }
    });
  };

  if (isLoading) {
    return (
      <div className="dashboard-card p-5 mb-6 animate-fade-in">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="dashboard-card p-5 mb-6">
        <div className="flex items-center mb-5">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mr-3">
            <i className="fas fa-users text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Max Timeslot Assignment for Examiners</h2>
        </div>

        {/* Capacity Validation Alerts */}
        {capacityErrors.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg border border-red-200 dark:border-red-800 mb-5">
            <div className="flex items-start">
              <i className="fas fa-exclamation-circle text-red-600 dark:text-red-400 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Capacity Issues</h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {capacityErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {capacityWarnings.length > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-5">
            <div className="flex items-start">
              <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Capacity Warnings</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {capacityWarnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                <i className="fas fa-calendar-check text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Minimum Required Capacity</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{neededCapacity} timeslots</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{summaryRequiredCapacity != null ? "From assignment summary" : `Based on ${sessionsToAssign} timeslots × ${perSession} examiners/timeslot`}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                <i className="fas fa-user-clock text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Capacity</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalCapacity} timeslots</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className={`fas fa-${capacityValid ? 'check-circle' : 'exclamation-circle'} text-${capacityValid ? 'green' : 'red'}-600 dark:text-${capacityValid ? 'green' : 'red'}-400`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Capacity Status</p>
                <p className={`text-lg font-semibold ${capacityValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {capacityValid ? 'Sufficient' : 'Insufficient'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Examiner Timeslot Assignments */}
        <div className="space-y-3">
          {examiners.map((examiner) => (
            <div key={examiner.id} className="card-section">
              <div className="card-section-header">
                <div className="card-section-icon icon-blue">
                  <i className="fas fa-user" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">{examiner.name}</h3>
                  {examiner.email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{examiner.email}</p>
                  )}
                </div>
                {examiner.assignments > 0 && (
                  <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {examiner.assignments} current assignments
                  </div>
                )}
              </div>
              <div className="form-field">
                <div className="number-input-container">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Max Timeslots:</span>
                  <button
                    className="number-btn"
                    onClick={() => handleExaminerLimitChange(examiner.id, toInt(examiner.maxSessions, 0) - 1)}
                    title="Decrease max timeslots"
                    disabled={
                      isUpdating ||
                      toInt(examiner.maxSessions, 0) <= toInt(examiner.assignments, 0)
                    }
                  >
                    <i className="fas fa-minus" />
                  </button>
                  <input
                    type="number"
                    className="number-input"
                    min={toInt(examiner.assignments, 0)}
                    value={examiner.maxSessions}
                    onChange={(e) => handleExaminerLimitChange(examiner.id, e.target.value)}
                    disabled={isUpdating}
                  />
                  <button
                    className="number-btn"
                    onClick={() => handleExaminerLimitChange(examiner.id, toInt(examiner.maxSessions, 0) + 1)}
                    title="Increase max timeslots"
                    disabled={isUpdating}
                  >
                    <i className="fas fa-plus" />
                  </button>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">timeslots</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between">
          <button onClick={onPrevious} className="btn btn-secondary" disabled={isUpdating}>
            <i className="fas fa-arrow-left mr-2" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleCompleteSetup}
            className={`btn ${canProceed ? 'btn-success' : 'btn-disabled'}`}
            disabled={!canProceed || isUpdating}
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <i className="fas fa-check mr-1.5" />
                <span>Complete Setup</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
