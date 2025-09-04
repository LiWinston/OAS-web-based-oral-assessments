'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSessionConfig } from '@/hooks/useSessionConfig.js';
import { calculateEndTimeWithConfig, to24Hour } from '@/lib/timeMath.js';
import { showError } from '@/lib/notifications.js';
import VenueSelect from '@/components/admin/schedule/VenueSelect.jsx';

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
  onCancelEdit = null,
  submitLabel
}) {
  const { data: sessionConfig } = useSessionConfig(assignmentId);
  
  const [timeSlotStartDate, setTimeSlotStartDate] = useState(editingSlot?.date || '');
  const [timeSlotStartTime, setTimeSlotStartTime] = useState(
    editingSlot ? editingSlot.startTime : '09:00'
  );
  const [sessionCount, setSessionCount] = useState(editingSlot?.sessionCount || 3);
  const [venueId, setVenueId] = useState(editingSlot?.venueId || null);
  const [venueName, setVenueName] = useState(editingSlot?.venue || '');

  const calculatedEndTime12h = useMemo(() => {
    if (!timeSlotStartDate || sessionCount <= 0 || !sessionConfig || !timeSlotStartTime) return 'N/A';
    return calculateEndTimeWithConfig(timeSlotStartTime, sessionCount, sessionConfig);
  }, [timeSlotStartDate, sessionCount, sessionConfig, timeSlotStartTime]);

  const calculatedEndTime24h = useMemo(() => {
    if (!calculatedEndTime12h || calculatedEndTime12h === 'N/A') return '';
    return to24Hour(calculatedEndTime12h);
  }, [calculatedEndTime12h]);

  const handleSubmit = () => {
    if (!timeSlotStartDate || !venueName || sessionCount <= 0) {
      showError('Please fill in all required fields');
      return;
    }
    
    const startTime = timeSlotStartTime;
    const endTime = calculatedEndTime24h || '';
    
    const timeSlotData = {
      id: editingSlot?.id,
      date: timeSlotStartDate,
      startTime: startTime,
      sessionCount: sessionCount,
      endTime: endTime,
      venue: venueName,
      venueId: venueId,
      requiredExaminers: sessionConfig?.examinersPerSession || 2,
      assignedExaminers: editingSlot?.assignedExaminers || [],
      status: editingSlot?.status || 'empty'
    };
    // eslint-disable-next-line no-console
    console.log('[TimeSlotForm] Add/Update time slot (local draft)', timeSlotData);
    
    onAddTimeSlot?.(timeSlotData);
    
    // Reset form if not editing
    if (!editingSlot) {
      setTimeSlotStartDate('');
      setTimeSlotStartTime('09:00');
      setSessionCount(3);
      setVenueId(null);
      setVenueName('');
    }
  };

  const handleCancel = () => {
    if (editingSlot) {
      onCancelEdit?.();
    } else {
      // Reset form
      setTimeSlotStartDate('');
      setTimeSlotStartTime('09:00');
      setSessionCount(3);
      setVenueId(null);
      setVenueName('');
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
            lang="en-GB"
            className="custom-input bg-white dark:bg-white text-gray-900"
            style={{ backgroundColor: '#ffffff' }}
            value={timeSlotStartDate}
            onChange={(e) => setTimeSlotStartDate(e.target.value)}
          />
        </div>

        {/* Start Time */}
        <div className="form-field">
          <label htmlFor="startTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
          <input
            id="startTime"
            type="time"
            lang="en-GB"
            step={300}
            className="custom-input bg-white dark:bg-white text-gray-900"
            style={{ backgroundColor: '#ffffff' }}
            value={timeSlotStartTime}
            onChange={(e) => setTimeSlotStartTime(e.target.value)}
          />
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
          <label htmlFor="endTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">End Time (calculated)</label>
          <input
            id="endTime"
            type="time"
            lang="en-GB"
            className="custom-input bg-gray-50 dark:bg-gray-800 text-gray-600 cursor-not-allowed"
            style={{ backgroundColor: '#f9fafb' }}
            value={calculatedEndTime24h}
            disabled
            tabIndex={-1}
            aria-disabled="true"
          />
          <p className="helper-text">Based on session length ({sessionConfig?.sessionLength || 30} min) and gap time ({sessionConfig?.gapTime || 5} min)</p>
        </div>

        {/* Venue */}
        <div className="form-field md:col-span-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Venue</label>
          <VenueSelect
            assignmentId={assignmentId}
            value={venueId}
            selectedName={venueName}
            onChange={(venue) => {
              setVenueId(venue?.id || null);
              setVenueName(venue?.name || '');
            }}
            placeholder="Search or add venue"
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
          <span>{submitLabel || (editingSlot ? 'Update Time Slot' : 'Add Time Slot')}</span>
        </button>
      </div>
    </div>
  );
}
