import React from 'react';

export default function AssessmentSelectionStep({
  isLoading,
  error,
  assignments,
  selectedAssignment,
  onSelectAssignment,
  onRetry,
  onNext,
  showDevInfo = false,
  queryEnabled = false,
}) {
  return (
    <div className="space-y-6">
      <div className="dashboard-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            <i className="fas fa-book text-blue-600 dark:text-blue-400 mr-2"></i>
            Select Assessment
          </h2>
          {showDevInfo && (
            <div className="text-xs text-gray-500">Query enabled: {queryEnabled.toString()}</div>
          )}
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200 mb-6">
          <i className="fas fa-info-circle mr-2"></i>
          Select an assessment to view available time slots. You can select as many sessions as you'd like up to your maximum allocation limit.
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading assessments...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200 mb-6">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Failed to load assessments.
            {onRetry && (
              <button onClick={onRetry} className="underline hover:no-underline ml-1">Try again</button>
            )}
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {assignments.map((assignment) => (
              <div
                key={assignment.assignmentId}
                className={`border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                  selectedAssignment?.assignmentId === assignment.assignmentId
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => onSelectAssignment(assignment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {assignment.assignmentName}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
                      <span className="flex items-center">
                        <i className="fas fa-graduation-cap mr-1.5"></i>
                        {assignment.courseCode}
                      </span>
                      <span className="flex items-center">
                        <i className={`fas ${assignment.assessmentType === 'GROUP' ? 'fa-users' : 'fa-user'} mr-1.5`}></i>
                        {assignment.assessmentType === 'GROUP' ? 'Group Assessment' : 'Individual Assessment'}
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-clock mr-1.5"></i>
                        {assignment.sessionDurationMinutes} min/session
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-user-friends mr-1.5"></i>
                        {assignment.requiredExaminers} examiner{assignment.requiredExaminers > 1 ? 's' : ''} required
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
                      <span>Available slots: <span className="font-medium text-blue-600 dark:text-blue-400">{assignment.availableTimeslots}</span></span>
                      <span>Capacity: <span className="font-medium text-green-600 dark:text-green-400">{assignment.examinerInfo.remainingCapacity}/{assignment.examinerInfo.maxSessions}</span></span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 ${
                    selectedAssignment?.assignmentId === assignment.assignmentId ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedAssignment?.assignmentId === assignment.assignmentId && (
                      <i className="fas fa-check text-white text-xs"></i>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">No available assessments</div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onNext}
            disabled={!selectedAssignment || isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            Continue to Time Slot Selection
            <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

