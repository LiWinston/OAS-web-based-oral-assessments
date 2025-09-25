'use client';

import { useEffect, useMemo, useState } from 'react';
import { showError } from '@/lib/notifications.js';
import VenueSelect from '@/components/admin/schedule/VenueSelect.jsx';
import { calculateEndTimeWithConfig, to24Hour } from '@/lib/timeMath.js';
import { venueService } from '@/services/venueService.js';

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
 * @typedef {import('@/types/timeslot.js').SessionConfig} SessionConfig
 */
export default function AddTimeSlotModal({
  assignmentId,
  isOpen,
  mode = 'add',
  initialData,
  availableExaminers = [],
  sessionConfig,
  onCancel,
  onSave,
}) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00'); // 24h HH:mm
  const [sessions, setSessions] = useState(3);
  const [venueId, setVenueId] = useState(null);
  const [venueName, setVenueName] = useState('');
  const [venueItems, setVenueItems] = useState([]);
  const [requiredExaminers, setRequiredExaminers] = useState(2);
  const [assignedExaminerIds, setAssignedExaminerIds] = useState([]);

  // Initialize from initialData when opened
  useEffect(() => {
    if (!isOpen) return;
    // Load venue list for this assignment so dropdown includes newly created venues
    (async () => {
      if (assignmentId) {
        try {
          const res = await venueService.list(assignmentId, '');
          setVenueItems(res?.data || []);
        } catch (e) {
          setVenueItems([]);
        }
      }
    })();
    if (mode === 'edit' && initialData) {
      setDate(initialData.date || '');
      if (initialData.startTime) {
        const t = String(initialData.startTime);
        // Accept HH:mm or HH:mm:ss
        setStartTime(t.length >= 5 ? t.slice(0,5) : '09:00');
      } else {
        setStartTime('09:00');
      }
      setSessions(Number(initialData.sessionCount || initialData.sessions || 3));
      setVenueName(initialData.venue || initialData.venueName || '');
      setVenueId(initialData.venueId || null);
      setRequiredExaminers(Number(initialData.requiredExaminers || 2));
      // Map assigned examiners into ids
      const ids = (initialData.assignedExaminers || []).map((ex) => ex.id).filter(Boolean);
      setAssignedExaminerIds(ids);
    } else {
      // defaults for add (prefill all fields from initialData when provided)
      const today = new Date();
      setDate(initialData?.date || today.toISOString().slice(0, 10));
      const st = initialData?.startTime ? String(initialData.startTime) : '09:00';
      setStartTime(st.length >= 5 ? st.slice(0,5) : '09:00');
      setSessions(Number(initialData?.sessionCount || initialData?.sessions || 3));
      setVenueId(initialData?.venueId || null);
      setVenueName(initialData?.venue || initialData?.venueName || '');
      setRequiredExaminers(Number(initialData?.requiredExaminers || 2));
      // Do not preselect examiners in add mode
      setAssignedExaminerIds([]);
    }
  }, [isOpen, initialData, availableExaminers, mode, assignmentId]);

  const endTime24h = useMemo(() => {
    if (!startTime || !sessions || !sessionConfig) return '';
    const end12 = calculateEndTimeWithConfig(startTime, Number(sessions), sessionConfig);
    return to24Hour(end12);
  }, [startTime, sessions, sessionConfig]);

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
    if (!date || !venueName) {
      showError('Please fill in all required fields');
      return;
    }
    
    const start = startTime;
    const result = {
      id: initialData?.id ?? undefined,
      date,
      startTime: start,
      endTime: endTime24h,
      venue: venueName,
      venueId: venueId || undefined,
      sessionCount: Number(sessions),
      sessions: Number(sessions), // for compatibility with existing handler
      requiredExaminers: Number(requiredExaminers),
      assignedExaminers: assignedExaminers,
      assignedExaminerIds: assignedExaminerIds,
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

          {/* Time + Timeslot count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                step={300}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Timeslots <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <button
                  onClick={() => setSessions((s) => Math.max(1, Number(s) - 1))}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-l-lg border border-gray-300 dark:border-gray-600"
                  aria-label="Decrement timeslots"
                  title="Decrease"
                >
                  <i className="fas fa-minus" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={sessions}
                  onChange={(e) => setSessions(Number(e.target.value) || 1)}
                  aria-label="Timeslot count"
                  className="w-20 text-center py-1 border-t border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
                <button
                  onClick={() => setSessions((s) => Number(s) + 1)}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-r-lg border border-gray-300 dark:border-gray-600"
                  aria-label="Increment timeslots"
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
            <input type="time" readOnly value={endTime24h} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Based on {sessionConfig?.sessionLength || 30}-minute timeslots with {sessionConfig?.gapTime || 5}-minute gaps
            </p>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Venue <span className="text-red-500">*</span>
            </label>
            <VenueSelect
              assignmentId={assignmentId}
              value={venueId}
              selectedName={venueName}
              items={venueItems}
              onChange={(venue) => {
                setVenueId(venue?.id || null);
                setVenueName(venue?.name || '');
              }}
              placeholder="Search or add venue"
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
