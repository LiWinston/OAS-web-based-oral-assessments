'use client';

import { to12Hour } from '@/lib/timeMath.js';
import StatusPill from '@/components/admin/schedule/StatusPill.jsx';

/**
 * TimeSlotCard - Individual time slot display card for management page
 * 
 * @typedef {import('@/types/timeslot.js').TimeSlot} TimeSlot
 */

export default function TimeSlotCard({ 
  timeSlot, 
  onEdit, 
  onDuplicate, 
  onDelete
}) {
  
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(timeSlot);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    onDuplicate?.(timeSlot);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(timeSlot.id);
  };

  return (
    <div className="time-slot-item">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div>
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
              {to12Hour(timeSlot.startTime)} - {to12Hour(timeSlot.endTime)}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              <i className="fas fa-map-marker-alt mr-1.5" /> {timeSlot.venue}
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <div className="mr-3 text-right">
            <StatusPill 
              status={timeSlot.status} 
              assigned={timeSlot.assignedExaminers?.length || 0} 
              required={timeSlot.requiredExaminers} 
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <i className="fas fa-users mr-1.5" /> {timeSlot.sessionCount} sessions
            </div>
          </div>
          <div className="flex">
            <button 
              className="action-btn action-btn-primary mr-1" 
              title="Edit Time Slot" 
              onClick={handleEdit}
            >
              <i className="fas fa-edit" />
            </button>
            <button 
              className="action-btn text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:bg-amber-900 dark:bg-opacity-20 dark:hover:bg-opacity-30 mr-1" 
              title="Duplicate Time Slot" 
              onClick={handleDuplicate}
            >
              <i className="fas fa-copy" />
            </button>
            <button 
              className="action-btn text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:bg-red-900 dark:bg-opacity-20 dark:hover:bg-opacity-30 mr-1" 
              title="Delete Time Slot" 
              onClick={handleDelete}
            >
              <i className="fas fa-trash-alt" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-row">
        <div className="flex-1 pr-6">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
            Examiner Allocated:
          </h4>
          {!timeSlot.assignedExaminers || timeSlot.assignedExaminers.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              No examiners assigned yet
            </div>
          ) : (
            <div className="flex flex-wrap">
              {timeSlot.assignedExaminers.map((examiner) => (
                <div key={examiner.id} className="examiner-chip pr-2">
                  {examiner.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-l border-gray-200 dark:border-gray-700 pl-6 flex flex-col items-start min-w-[180px]">
          <div className="flex items-center w-full justify-between">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              0/{timeSlot.sessionCount} session booked
            </div>
            <button className="ml-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs text-blue-600 dark:text-blue-400">
              <i className="fas fa-chevron-down" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
