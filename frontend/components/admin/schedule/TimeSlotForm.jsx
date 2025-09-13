'use client';

import { useEffect, useMemo, useState } from 'react';
import { to24Hour } from '@/lib/timeMath.js';
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
  const [timeSlotStartDate, setTimeSlotStartDate] = useState(editingSlot?.date || '');
  const [timeSlotStartTime, setTimeSlotStartTime] = useState(
    editingSlot ? editingSlot.startTime : '09:00'
  );
  const [sessionCount, setSessionCount] = useState(editingSlot?.sessionCount || 3);
  const [lengthMinutes, setLengthMinutes] = useState(editingSlot?.lengthMinutes || 30);
  const [gapTimeMinutes, setGapTimeMinutes] = useState(editingSlot?.gapTimeMinutes || 5);
  const [requiredExaminers, setRequiredExaminers] = useState(editingSlot?.requiredExaminers || 2);
  const [capacity, setCapacity] = useState(editingSlot?.capacity || 1);
  const [venueId, setVenueId] = useState(editingSlot?.venueId || null);
  const [venueName, setVenueName] = useState(editingSlot?.venue || '');

  const addMinutes = (hhmm, minutes) => {
    const [hStr, mStr] = String(hhmm).split(':');
    let total = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutes;
    total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // End time of the whole block: start + (count*length) + ((count-1)*gap)
  const calculatedEndTime24h = useMemo(() => {
    if (!timeSlotStartTime || sessionCount <= 0 || lengthMinutes <= 0 || gapTimeMinutes < 0) return '';
    const total = Number(sessionCount) * Number(lengthMinutes) + (Number(sessionCount) - 1) * Number(gapTimeMinutes);
    return addMinutes(timeSlotStartTime, total);
  }, [timeSlotStartTime, sessionCount, lengthMinutes, gapTimeMinutes]);

  const handleSubmit = () => {
    if (!timeSlotStartDate || !venueName || sessionCount <= 0) {
      showError('Please fill in all required fields');
      return;
    }
    // Expand to individual sessions
    const sessions = [];
    let cursor = timeSlotStartTime;
    for (let i = 0; i < Number(sessionCount); i += 1) {
      const s = cursor;
      const e = addMinutes(s, Number(lengthMinutes));
      sessions.push({
        id: `${timeSlotStartDate}-${s}-${i}`,
        date: timeSlotStartDate,
        startTime: s,
        endTime: e,
        venue: venueName,
        venueId: venueId,
        requiredExaminers: Number(requiredExaminers) || 1,
        capacity: Number(capacity) || 1,
        assignedExaminers: []
      });
      cursor = addMinutes(e, Number(gapTimeMinutes));
    }
    onAddTimeSlot?.(sessions);
    
    // Reset form if not editing
    if (!editingSlot) {
      setTimeSlotStartDate('');
      setTimeSlotStartTime('09:00');
      setSessionCount(3);
      setLengthMinutes(30);
      setGapTimeMinutes(5);
      setRequiredExaminers(2);
      setCapacity(1);
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
          {editingSlot ? 'Edit Batch' : 'Batch Create Sessions'}
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
              className="number-input bg-white dark:bg-white text-gray-900"
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

        {/* Length & Gap */}
        <div className="form-field">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Length (minutes)</label>
          <input
            type="number"
            min="1"
            className="custom-input bg-white dark:bg-white text-gray-900"
            value={lengthMinutes}
            onChange={(e) => setLengthMinutes(Number(e.target.value) || 1)}
          />
        </div>
        <div className="form-field">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gap Time (minutes)</label>
          <input
            type="number"
            min="0"
            className="custom-input bg-white dark:bg-white text-gray-900"
            value={gapTimeMinutes}
            onChange={(e) => setGapTimeMinutes(Number(e.target.value) || 0)}
          />
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
          <p className="helper-text">Based on length ({lengthMinutes} min) and gap time ({gapTimeMinutes} min)</p>
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
        {/* Requirements */}
        <div className="form-field">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Required Examiners per Session</label>
          <input type="number" min="1" className="custom-input bg-white dark:bg-white text-gray-900" value={requiredExaminers} onChange={(e) => setRequiredExaminers(Number(e.target.value) || 1)} />
        </div>
        <div className="form-field">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity (student groups)</label>
          <input type="number" min="1" className="custom-input bg-white dark:bg-white text-gray-900" value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)} />
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
        <button onClick={handleSubmit} className="btn btn-primary" title="Add batch definition">
          <i className="fas fa-plus mr-1.5" />
          <span>{submitLabel || (editingSlot ? 'Update Batch' : 'Add Batch')}</span>
        </button>
      </div>
    </div>
  );
}
