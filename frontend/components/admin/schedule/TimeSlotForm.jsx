'use client';

import { useState } from 'react';
import { useSessionConfig } from '@/hooks/useSessionConfig.js';
import { calculateEndTimeWithConfig } from '@/lib/timeMath.js';
import { showError } from '@/lib/notifications.js';

/**
 * TimeSlotForm - Form for adding/editing time slots in the wizard
 * Uses session config for time calculations (no hard-coded values)
 * 
 * @typedef {import('@/types/timeslot.js').TimeSlot} TimeSlot
 */

export default function TimeSlotForm({ 
  assignmentId, 
  onAddTimeSlot, 
  editingSlot = null, 
  onCancelEdit = null 
}) {
  const { data: sessionConfig } = useSessionConfig(assignmentId);
  
  const [timeSlotStartDate, setTimeSlotStartDate] = useState(editingSlot?.date || '');
  const [timeSlotStartTimeHour, setTimeSlotStartTimeHour] = useState(
    editingSlot ? editingSlot.startTime.split(':')[0] : '9'
  );
  const [timeSlotStartTimeMinute, setTimeSlotStartTimeMinute] = useState(
    editingSlot ? editingSlot.startTime.split(':')[1] : '00'
  );
  const [sessionCount, setSessionCount] = useState(editingSlot?.sessionCount || 3);
  const [timeSlotVenue, setTimeSlotVenue] = useState(editingSlot?.venue || '');

  const calculateEndTime = () => {
    if (!timeSlotStartDate || sessionCount <= 0 || !sessionConfig) return 'N/A';
    
    const startTime24h = `${timeSlotStartTimeHour.padStart(2, '0')}:${timeSlotStartTimeMinute}`;
    return calculateEndTimeWithConfig(startTime24h, sessionCount, sessionConfig);
  };

  const formatTime24h = () => {
    return `${timeSlotStartTimeHour.padStart(2, '0')}:${timeSlotStartTimeMinute}`;
  };

  const handleSubmit = () => {
    if (!timeSlotStartDate || !timeSlotVenue || sessionCount <= 0) {
      showError('Please fill in all required fields');
      return;
    }
    
    const startTime = formatTime24h();
    const endTime = calculateEndTime();
    
    const timeSlotData = {
      id: editingSlot?.id,
      date: timeSlotStartDate,
      startTime: startTime,
      sessionCount: sessionCount,
      endTime: endTime,
      venue: timeSlotVenue,
      requiredExaminers: sessionConfig?.examinersPerSession || 2,
      assignedExaminers: editingSlot?.assignedExaminers || [],
      status: editingSlot?.status || 'empty'
    };
    
    onAddTimeSlot?.(timeSlotData);
    
    // Reset form if not editing
    if (!editingSlot) {
      setTimeSlotStartDate('');
      setTimeSlotStartTimeHour('9');
      setTimeSlotStartTimeMinute('00');
      setSessionCount(3);
      setTimeSlotVenue('');
    }
  };

  const handleCancel = () => {
    if (editingSlot) {
      onCancelEdit?.();
    } else {
      // Reset form
      setTimeSlotStartDate('');
      setTimeSlotStartTimeHour('9');
      setTimeSlotStartTimeMinute('00');
      setSessionCount(3);
      setTimeSlotVenue('');
    }
  };

  return (
    <div className="card-section">
      <div className="card-section-header">
        <div className="card-section-icon icon-blue">
          <i className="fas fa-plus-circle" />
        </div>
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
          {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div className="form-field">
          <label htmlFor="timeSlotStartDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
          <input
            type="date"
            id="timeSlotStartDate"
            className="custom-input"
            value={timeSlotStartDate}
            onChange={(e) => setTimeSlotStartDate(e.target.value)}
          />
        </div>

        {/* Start Time */}
        <div className="form-field">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
          <div className="time-picker">
            <select
              className="custom-input"
              value={timeSlotStartTimeHour}
              onChange={(e) => setTimeSlotStartTimeHour(e.target.value)}
              title="Select hour"
            >
              {[...Array(24)].map((_, i) => (
                <option key={i} value={i.toString().padStart(2, '0')}>
                  {i.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="time-separator">:</span>
            <select
              className="custom-input"
              value={timeSlotStartTimeMinute}
              onChange={(e) => setTimeSlotStartTimeMinute(e.target.value)}
              title="Select minute"
            >
              {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(minute => (
                <option key={minute} value={minute}>{minute}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Session Count */}
        <div className="form-field">
          <label htmlFor="sessionCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Number of Sessions</label>
          <div className="number-input-container">
            <button 
              className="number-btn" 
              onClick={() => setSessionCount(Math.max(1, sessionCount - 1))} 
              title="Decrease session count"
            >
              <i className="fas fa-minus" />
            </button>
            <input
              type="number"
              id="sessionCount"
              className="number-input"
              min="1"
              value={sessionCount}
              onChange={(e) => setSessionCount(Number(e.target.value) || 1)}
            />
            <button 
              className="number-btn" 
              onClick={() => setSessionCount(sessionCount + 1)} 
              title="Increase session count"
            >
              <i className="fas fa-plus" />
            </button>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">sessions</span>
          </div>
        </div>

        {/* End Time (calculated) */}
        <div className="form-field">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Time (calculated)</label>
          <div className="time-display">{calculateEndTime()}</div>
          <p className="helper-text">
            Based on session length ({sessionConfig?.sessionLength || 30} min) and gap time ({sessionConfig?.gapTime || 5} min)
          </p>
        </div>

        {/* Venue */}
        <div className="form-field md:col-span-2">
          <label htmlFor="timeSlotVenue" className="text-sm font-medium text-gray-700 dark:text-gray-300">Venue</label>
          <input
            type="text"
            id="timeSlotVenue"
            className="custom-input"
            placeholder="e.g. Room 405, Engineering Building"
            value={timeSlotVenue}
            onChange={(e) => setTimeSlotVenue(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-3">
        {editingSlot && (
          <button
            onClick={handleCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
        <button onClick={handleSubmit} className="btn btn-primary" title="Add or update time slot">
          <i className="fas fa-plus mr-1.5" />
          <span>{editingSlot ? 'Update Time Slot' : 'Add Time Slot'}</span>
        </button>
      </div>
    </div>
  );
}