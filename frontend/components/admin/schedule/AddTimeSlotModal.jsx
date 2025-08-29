'use client';

import { useEffect, useMemo, useState } from 'react';
import { showError } from '../../../lib/utils/notifications.js';

/**
 * AddTimeSlotModal
 *
 * A reusable modal for creating or editing a time slot.
 * This component is also used by EditTimeSlotModal via props.
 * NOW ACCEPTS INJECTED SESSION CONFIG (per Section 15)
 *
 * Props:
 * - isOpen: boolean - whether modal is visible
 * - mode: 'add' | 'edit'
 * - initialData: optional existing time slot data
 * - availableExaminers: array of { id, name, avatar?, assignments? }
 * - sessionConfig: object with sessionLength and gapTime
 * - onCancel: () => void
 * - onSave: (timeSlotData) => void
 * 
 * @typedef {import('../../lib/types/timeslot.js').SessionConfig} SessionConfig
 */
export default function AddTimeSlotModal({
  isOpen,
  mode = 'add',
  initialData,
  availableExaminers = [],
  sessionConfig,
  onCancel,
  onSave,
}) {
  const [date, setDate] = useState('');
  const [startHour, setStartHour] = useState('9');
  const [startMinute, setStartMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [sessions, setSessions] = useState(3);
  const [venue, setVenue] = useState('');
  const [requiredExaminers, setRequiredExaminers] = useState(2);
  const [assignedExaminerIds, setAssignedExaminerIds] = useState([]);

  // Initialize from initialData when opened
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setDate(initialData.date || '');
      if (initialData.startTime) {
        const parts = String(initialData.startTime).split(' ');
        const [h, m] = parts[0].split(':');
        setStartHour(h);
        setStartMinute(m);
        setAmpm(parts[1] || 'AM');
      } else {
        setStartHour('9');
        setStartMinute('00');
        setAmpm('AM');
      }
      setSessions(Number(initialData.sessions || 3));
      setVenue(initialData.venue || '');
      setRequiredExaminers(Number(initialData.requiredExaminers || 2));
      // Map assigned examiners into ids
      const ids = (initialData.assignedExaminers || []).map((ex) => ex.id).filter(Boolean);
      setAssignedExaminerIds(ids);
    } else {
      // defaults for add
      const today = new Date();
      setDate(today.toISOString().slice(0, 10));
      setStartHour('9');
      setStartMinute('00');
      setAmpm('AM');
      setSessions(3);
      setVenue('');
      setRequiredExaminers(2);
      // preselect first two examiners if available
      setAssignedExaminerIds(availableExaminers.slice(0, 2).map((e) => e.id));
    }
  }, [isOpen, initialData, availableExaminers]);

  const endTime = useMemo(() => {
    if (!startHour || !startMinute || !sessions || !sessionConfig) return 'N/A';
    let hour24 = parseInt(startHour, 10);
    const minute = parseInt(startMinute, 10);
    if (ampm === 'PM' && hour24 < 12) hour24 += 12;
    if (ampm === 'AM' && hour24 === 12) hour24 = 0;

    // Use injected session config instead of hard-coded values (per Section 15)
    const sessionLength = sessionConfig.sessionLength || 30; // minutes
    const gapTime = sessionConfig.gapTime || 5; // minutes
    const totalMinutes = sessions * sessionLength + (sessions - 1) * gapTime;

    let endHour = hour24 + Math.floor((minute + totalMinutes) / 60);
    let endMinute = (minute + totalMinutes) % 60;

    let endPeriod = 'AM';
    if (endHour >= 12) {
      endPeriod = 'PM';
      if (endHour > 12) endHour -= 12;
    }
    if (endHour === 0) endHour = 12;
    return `${endHour}:${String(endMinute).padStart(2, '0')} ${endPeriod}`;
  }, [startHour, startMinute, ampm, sessions, sessionConfig]);

  const assignedExaminers = useMemo(
    () => availableExaminers.filter((e) => assignedExaminerIds.includes(e.id)),
    [availableExaminers, assignedExaminerIds]
  );

  const unassignedExaminers = useMemo(
    () => availableExaminers.filter((e) => !assignedExaminerIds.includes(e.id)),
    [availableExaminers, assignedExaminerIds]
  );

  const handleAddExaminer = (id) => {
    if (!id) return;
    setAssignedExaminerIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleRemoveExaminer = (id) => {
    setAssignedExaminerIds((prev) => prev.filter((eid) => eid !== id));
  };

  const handleSave = () => {
    if (!date || !venue) {
      showError('Please fill in all required fields');
      return;
    }
    
    const startTime = `${startHour}:${startMinute} ${ampm}`;
    const result = {
      id: initialData?.id ?? undefined,
      date,
      startTime,
      endTime,
      venue,
      sessions: Number(sessions),
      requiredExaminers: Number(requiredExaminers),
      assignedExaminers: assignedExaminers,
      status: assignedExaminers.length === 0 ? 'empty' : (assignedExaminers.length < Number(requiredExaminers) ? 'partial' : 'full'),
    };
    
    console.log('Modal sending data:', result); // Debug log
    onSave?.(result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => onCancel?.()}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            {mode === 'edit' ? 'Edit Time Slot' : 'Add New Time Slot'}
          </h3>
          <button
            onClick={() => onCancel?.()}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
            title="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label htmlFor="ts-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="ts-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Time + Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <select
                  aria-label="Start hour"
                  className="time-part"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                >
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const val = String(idx + 1);
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>
                <span className="time-separator">:</span>
                <select
                  aria-label="Start minute"
                  className="time-part"
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                >
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="am-pm-toggle ml-2">
                  <button
                    type="button"
                    className={`am-pm-btn ${ampm === 'AM' ? 'selected' : ''}`}
                    onClick={() => setAmpm('AM')}
                    aria-pressed={ampm === 'AM'}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`am-pm-btn ${ampm === 'PM' ? 'selected' : ''}`}
                    onClick={() => setAmpm('PM')}
                    aria-pressed={ampm === 'PM'}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Sessions <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <button
                  onClick={() => setSessions((s) => Math.max(1, Number(s) - 1))}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-l-lg border border-gray-300 dark:border-gray-600"
                  aria-label="Decrement sessions"
                  title="Decrease"
                >
                  <i className="fas fa-minus" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={sessions}
                  onChange={(e) => setSessions(Number(e.target.value) || 1)}
                  aria-label="Session count"
                  className="w-20 text-center py-1 border-t border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
                <button
                  onClick={() => setSessions((s) => Number(s) + 1)}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-r-lg border border-gray-300 dark:border-gray-600"
                  aria-label="Increment sessions"
                  title="Increase"
                >
                  <i className="fas fa-plus" />
                </button>
              </div>
            </div>
          </div>

          {/* End time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time (calculated)</label>
            <div className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600">
              {endTime}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Based on {sessionConfig?.sessionLength || 30}-minute sessions with {sessionConfig?.gapTime || 5}-minute gaps
            </p>
          </div>

          {/* Venue */}
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Venue <span className="text-red-500">*</span>
            </label>
            <input
              id="venue"
              type="text"
              placeholder="e.g. Engineering Building, Room 405"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Required Examiners */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Required Examiners</label>
            <div className="flex items-center">
              <button
                onClick={() => setRequiredExaminers((n) => Math.max(1, Number(n) - 1))}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-l-lg border border-gray-300 dark:border-gray-600"
                aria-label="Decrement required examiners"
                title="Decrease"
              >
                <i className="fas fa-minus" />
              </button>
              <input
                type="number"
                min={1}
                value={requiredExaminers}
                onChange={(e) => setRequiredExaminers(Number(e.target.value) || 1)}
                aria-label="Required examiners"
                className="w-20 text-center py-1 border-t border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
              <button
                onClick={() => setRequiredExaminers((n) => Number(n) + 1)}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-r-lg border border-gray-300 dark:border-gray-600"
                aria-label="Increment required examiners"
                title="Increase"
              >
                <i className="fas fa-plus" />
              </button>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">examiners</span>
            </div>
          </div>

          {/* Examiner assignment */}
          <div className="mt-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign Examiners</h4>
              <div className="flex items-center space-x-2">
                <select
                  aria-label="Add examiner"
                  className="rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 px-2 text-sm"
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) handleAddExaminer(id);
                    e.currentTarget.selectedIndex = 0;
                  }}
                >
                  <option value="">Select examiner...</option>
                  {unassignedExaminers.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {assignedExaminers.map((ex) => (
                <div key={ex.id} className="examiner-item flex items-center justify-between p-2 rounded-lg">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleRemoveExaminer(ex.id)}
                      className="mr-3 text-red-500 hover:text-red-700"
                      aria-label={`Remove ${ex.name}`}
                      title="Remove examiner"
                    >
                      <i className="fas fa-trash" />
                    </button>
                    <img src={ex.avatar || '/api/placeholder/24/24'} alt="Examiner" className="w-6 h-6 rounded-full mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ex.name}</span>
                  </div>
                  <div
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      (ex.assignments ?? 0) > 2
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}
                  >
                    {(ex.assignments ?? 0)} assignments
                  </div>
                </div>
              ))}
              {assignedExaminers.length === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">No examiners assigned</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={() => onCancel?.()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {mode === 'edit' ? 'Update Time Slot' : 'Add Time Slot'}
          </button>
        </div>
      </div>
    </div>
  );
}
