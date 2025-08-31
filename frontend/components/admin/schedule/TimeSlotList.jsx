'use client';

import { to12Hour } from '@/lib/timeMath.js';
import { confirm } from '@/lib/notifications.js';

/**
 * TimeSlotList - Display and manage list of time slots in the wizard
 * Accumulates draft slots locally, calls createTimeSlotsBatch() on "Done"
 * 
 * @typedef {import('@/types/timeslot.js').TimeSlot} TimeSlot
 */

export default function TimeSlotList({ 
  timeSlots = [], 
  onEditTimeSlot, 
  onDuplicateTimeSlot, 
  onDeleteTimeSlot,
  totalSessions = 0,
  totalAssignedSessions = 0,
  availableExaminers = 0
}) {

  const handleDeleteTimeSlot = async (index) => {
    const confirmed = await confirm('Are you sure you want to delete this time slot?');
    if (confirmed) {
      onDeleteTimeSlot?.(index);
    }
  };

  if (timeSlots.length === 0) {
    return (
      <div className="dashboard-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Assessment Time Slots</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">0 time slots added</span>
        </div>

        <div className="p-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-calendar-plus text-gray-400 dark:text-gray-500 text-xl" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-3">No assessment time slots have been added yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Use the form above to add your first time slot</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Time Slots List */}
      <div className="dashboard-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Assessment Time Slots</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{timeSlots.length} time slots added</span>
        </div>

        <div className="space-y-3">
          {timeSlots.map((timeSlot, index) => (
            <div key={timeSlot.id || index} className="time-slot-card">
              <div className="time-slot-header">
                <div className="flex items-center">
                  <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">{timeSlot.date}</span>
                </div>
                <div className="time-slot-actions">
                  <button 
                    onClick={() => onEditTimeSlot?.(index)} 
                    className="time-slot-action-btn action-edit" 
                    title="Edit Time Slot"
                  >
                    <i className="fas fa-edit" />
                  </button>
                  <button 
                    onClick={() => onDuplicateTimeSlot?.(index)} 
                    className="time-slot-action-btn action-duplicate" 
                    title="Duplicate Time Slot"
                  >
                    <i className="fas fa-copy" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTimeSlot(index)} 
                    className="time-slot-action-btn action-delete" 
                    title="Delete Time Slot"
                  >
                    <i className="fas fa-trash-alt" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Time</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <i className="fas fa-clock text-gray-400 mr-1" />
                    <span>{to12Hour(timeSlot.startTime)} - {to12Hour(timeSlot.endTime)}</span>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Sessions</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <i className="fas fa-users text-gray-400 mr-1" />
                    <span>{timeSlot.sessionCount} sessions</span>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Venue</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <i className="fas fa-map-marker-alt text-gray-400 mr-1" />
                    <span>{timeSlot.venue}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
              <i className="fas fa-calendar-check text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
              <i className="fas fa-user-check text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Sessions</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalAssignedSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
              <i className="fas fa-users text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available Examiners</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{availableExaminers}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}