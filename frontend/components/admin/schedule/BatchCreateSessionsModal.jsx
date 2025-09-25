'use client';

import { useEffect, useMemo, useState } from 'react';

import VenueSelect from '@/components/admin/schedule/VenueSelect.jsx';

export default function BatchCreateSessionsModal({ isOpen, onClose, onGenerate, assignmentId, defaultDate }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [count, setCount] = useState(3);
  const [length, setLength] = useState(30);
  const [gapTime, setGapTime] = useState(5);
  const [venueName, setVenueName] = useState('');
  const [venueId, setVenueId] = useState(null);
  const [requiredExaminers, setRequiredExaminers] = useState(2);
  const [capacity, setCapacity] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().slice(0, 10);
    setDate(defaultDate || today);
    setStartTime('09:00');
    setCount(3);
    setLength(30);
    setGapTime(5);
    setVenueName('');
    setVenueId(null);
    setRequiredExaminers(2);
    setCapacity(1);
  }, [isOpen, defaultDate]);

  const canGenerate = useMemo(() => Boolean(date && startTime && count > 0 && length > 0 && gapTime >= 0 && venueName), [date, startTime, count, length, gapTime, venueName]);

  const addMinutes = (hhmm, minutes) => {
    const [hStr, mStr] = String(hhmm).split(':');
    let total = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutes;
    total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Calculated block end time: start + (count*length) + (count-1)*gap
  const blockEndTime = useMemo(() => {
    if (!startTime || !count || !length) return '';
    const total = Number(count) * Number(length) + (Number(count) - 1) * Number(gapTime || 0);
    return addMinutes(startTime, total);
  }, [startTime, count, length, gapTime]);

  const handleGenerate = () => {
    if (!canGenerate) return;
    const generator = {
      date,
      startTime,
      count: Number(count),
      length: Number(length),
      gapTime: Number(gapTime),
      venueId,
      requiredExaminers: Number(requiredExaminers),
      capacity: Number(capacity),
    };
    onGenerate?.(generator);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Batch Create Timeslots</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-field"><label className="text-sm font-medium">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="custom-input bg-white dark:bg-white text-gray-900" /></div>
          <div className="form-field"><label className="text-sm font-medium">Start Time</label><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="custom-input bg-white dark:bg-white text-gray-900" /></div>
          <div className="form-field"><label className="text-sm font-medium">Timeslot Count</label><input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} className="custom-input bg-white dark:bg-white text-gray-900" /></div>
          <div className="form-field"><label className="text-sm font-medium">Length per timeslot (minutes)</label><input type="number" min={1} value={length} onChange={(e) => setLength(Number(e.target.value) || 1)} className="custom-input bg-white dark:bg-white text-gray-900" /></div>
          <div className="form-field"><label className="text-sm font-medium">Gap between timeslots (minutes)</label><input type="number" min={0} value={gapTime} onChange={(e) => setGapTime(Number(e.target.value) || 0)} className="custom-input bg-white dark:bg-white text-gray-900" /></div>
          <div className="form-field"><label className="text-sm font-medium">End Time (calculated)</label><input type="time" value={blockEndTime} readOnly disabled className="custom-input bg-gray-50 dark:bg-gray-800 text-gray-600 cursor-not-allowed" /></div>
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
          <div className="form-field"><label className="text-sm font-medium">Required Examiners</label><input type="number" min={1} value={requiredExaminers} onChange={(e) => setRequiredExaminers(Number(e.target.value) || 1)} className="custom-input bg-white dark:bg-white text-gray-900" /></div>
          <div className="form-field"><label className="text-sm font-medium">Capacity (student groups)</label><input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)} className="custom-input bg-white dark:bg-white text-gray-900" /></div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleGenerate} className="btn btn-primary" disabled={!canGenerate}><i className="fas fa-plus mr-1.5" /> Generate</button>
        </div>
      </div>
    </div>
  );
}
