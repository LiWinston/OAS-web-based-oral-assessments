import React from 'react';
import { formatVenue } from '@/utils/formatVenue';
import { toLocalDateKey } from '@/utils/dateUtils';

function formatTime(isoString, timezone = 'Australia/Melbourne') {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-AU', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function TimeslotList({
  isLoading,
  error,
  onRetry,
  timeSlots = [],
  selectedDate,
  onToggleSlot,
  isSlotSelected,
  selectionMessage,
}) {
  const slotsForDate = timeSlots.filter((slot) => toLocalDateKey(new Date(slot.start)) === selectedDate);

  if (!selectedDate) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-calendar-day text-gray-400 dark:text-gray-500 text-2xl"></i>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Select a date from the calendar to view available sessions</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
          Available Sessions - {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
        {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
      </div>

      {selectionMessage && (
        <div className={`p-3 rounded mb-3 text-sm ${selectionMessage.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200'}`}>
          <i className={`fas ${selectionMessage.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-2`}></i>
          {selectionMessage.text}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading sessions...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200 mb-6">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          Failed to load sessions.
          {onRetry && (
            <button onClick={onRetry} className="underline hover:no-underline ml-1">Try again</button>
          )}
        </div>
      )}

      {!error && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {slotsForDate.map((slot) => {
            const canSelect = slot.availability?.canSelect;
            const reason = slot.availability?.reason;
            const selected = isSlotSelected(slot.slotId);
            const needsMoreExaminers = slot.currentExaminers < slot.requiredExaminers;
            return (
              <div
                key={slot.slotId}
                className={`p-3 border rounded-lg transition-colors ${
                  slot.isExaminerAlreadyAssigned
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10 cursor-not-allowed'
                    : !canSelect
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                    : selected
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                }`}
                onClick={() => canSelect && !slot.isExaminerAlreadyAssigned && onToggleSlot(slot)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                      {slot.isExaminerAlreadyAssigned && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          <i className="fas fa-check-circle mr-1"></i>
                          You're Assigned
                        </span>
                      )}
                      {needsMoreExaminers && !slot.isExaminerAlreadyAssigned && canSelect && (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          Needs Examiner
                        </span>
                      )}
                      {!canSelect && reason && !slot.isExaminerAlreadyAssigned && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                          {reason === 'SLOT_FULL' || reason === 'SESSION_CLOSED' ? 'Full' : reason === 'TIME_CONFLICT' ? 'Conflict' : reason === 'ALREADY_ASSIGNED' ? 'Assigned' : reason}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {formatVenue(slot.venue)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <i className="fas fa-user-check mr-1"></i>
                      {slot.currentExaminers}/{slot.requiredExaminers} examiners assigned
                      {slot.assignedExaminers && slot.assignedExaminers.length > 0 && (
                        <span className="ml-1">
                          ({slot.assignedExaminers.map(e => e.name || 'Examiner').join(', ')})
                        </span>
                      )}
                    </div>
                    {typeof slot.capacity !== 'undefined' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {slot.bookingCount ?? 0}/{slot.capacity} bookings
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      slot.sessionCount === 1
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : slot.sessionCount === 2
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                    }`}>
                      {slot.sessionCount} session{slot.sessionCount !== 1 ? 's' : ''}
                    </span>
                    {canSelect && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selected && <i className="fas fa-check text-white text-xs"></i>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {slotsForDate.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-calendar-times text-gray-400 dark:text-gray-500 text-2xl"></i>
              </div>
              <p className="text-gray-600 dark:text-gray-400">No sessions available for this date</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
