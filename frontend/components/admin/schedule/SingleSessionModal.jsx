'use client';

import { useState, useEffect, useMemo } from 'react';

import VenueSelect from '@/components/admin/schedule/VenueSelect.jsx';

export default function SingleSessionModal({ isOpen, onClose, onCreate, onUpdate, defaultDate, assignmentId, mode = 'create', initialSession = null }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [length, setLength] = useState(30);
  const [venueName, setVenueName] = useState('');
  const [venueId, setVenueId] = useState(null);
  const [requiredExaminers, setRequiredExaminers] = useState(2);
  const [capacity, setCapacity] = useState(1);

  const minutesBetween = (s, e) => {
    if (!s || !e) return 30;
    const [sh, sm] = String(s).split(':').map((n) => parseInt(n, 10));
    const [eh, em] = String(e).split(':').map((n) => parseInt(n, 10));
    let smi = sh * 60 + sm;
    let emi = eh * 60 + em;
    let diff = emi - smi;
    if (diff <= 0) diff += 24 * 60;
    return diff;
  };

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date();
    const baseDate = defaultDate || today.toISOString().slice(0, 10);
    if (initialSession) {
      setDate(initialSession.date || baseDate);
      setStartTime((initialSession.startTime || '09:00').slice(0, 5));
      setLength(minutesBetween(initialSession.startTime, initialSession.endTime));
      setVenueName(initialSession.venue || initialSession.venueName || '');
      setVenueId(initialSession.venueId || null);
      setRequiredExaminers(Number(initialSession.requiredExaminers ?? 2));
      setCapacity(Number(initialSession.capacity ?? 1));
    } else {
      setDate(baseDate);
      setStartTime('09:00');
      setLength(30);
      setVenueName('');
      setVenueId(null);
      setRequiredExaminers(2);
      setCapacity(1);
    }
  }, [isOpen, defaultDate, initialSession]);

  const addMinutes = (hhmm, minutes) => {
    const [hStr, mStr] = String(hhmm).split(':');
    let total = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + Number(minutes || 0);
    total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const endTime = useMemo(() => {
    if (!startTime || !length) return '';
    return addMinutes(startTime, Number(length));
  }, [startTime, length]);

  const handleSubmit = () => {
    if (!date || !startTime || !length || !venueName) return;
    const base = {
      date,
      startTime,
      endTime,
      venue: venueName,
      venueId,
      requiredExaminers: Number(requiredExaminers) || 1,
      capacity: Number(capacity) || 1,
    };
    if (mode === 'edit' && initialSession?.id != null) {
      onUpdate?.({ ...base, id: initialSession.id });
    } else {
      onCreate?.({ ...base, id: `${date}-${startTime}-${Math.random().toString(36).slice(2,7)}` });
    }
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{mode === 'edit' ? 'Edit Timeslot' : 'Create Timeslot'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-field">
            <label className="text-sm font-medium">Date</label>
            <input type="date" className="custom-input bg-white dark:bg-white text-gray-900" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="text-sm font-medium">Start Time</label>
            <input type="time" className="custom-input bg-white dark:bg-white text-gray-900" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="text-sm font-medium">Length (minutes)</label>
            <input
              type="number"
              min={1}
              className="custom-input bg-white dark:bg-white text-gray-900"
              value={length}
              onChange={(e) => setLength(Number(e.target.value) || 1)}
            />
          </div>
          <div className="form-field">
            <label className="text-sm font-medium">End Time (calculated)</label>
            <input
              type="time"
              className="custom-input bg-gray-50 dark:bg-gray-800 text-gray-600 cursor-not-allowed"
              value={endTime}
              readOnly
              disabled
            />
          </div>
          <div className="form-field md:col-span-2">
            <label className="text-sm font-medium">Venue</label>
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
          <div className="form-field">
            <label className="text-sm font-medium">Required Examiners</label>
            <input type="number" min={1} className="custom-input bg-white dark:bg-white text-gray-900" value={requiredExaminers} onChange={(e) => setRequiredExaminers(Number(e.target.value) || 1)} />
          </div>
          <div className="form-field">
            <label className="text-sm font-medium">Capacity (student groups)</label>
            <input type="number" min={1} className="custom-input bg-white dark:bg-white text-gray-900" value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary">
            {mode === 'edit' ? (
              <>
                <i className="fas fa-save mr-1.5" /> Save
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-1.5" /> Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
