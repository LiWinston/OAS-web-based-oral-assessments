import React from 'react';

function formatTime(isoString, timezone = 'Australia/Melbourne') {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-AU', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function SelectionSummary({ allocatedSlots = [], totalSessions = 0, onRemoveSlot, onClear }) {
  if (allocatedSlots.length === 0) return null;

  return (
    <div className="dashboard-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          <i className="fas fa-list-check text-blue-600 dark:text-blue-400 mr-2"></i>
          Selection Summary
        </h2>
        <button className="text-xs text-red-600 dark:text-red-400 hover:underline" onClick={onClear}>
          <i className="fas fa-trash-alt mr-1"></i>
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Venue</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timeslots</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocatedSlots.map((slot) => (
              <tr key={slot.slotId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-3 py-2 text-sm">
                  {new Date(slot.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-3 py-2 text-sm">{formatTime(slot.start)} - {formatTime(slot.end)}</td>
                <td className="px-3 py-2 text-sm">{slot.venue?.building} {slot.venue?.room}</td>
                <td className="px-3 py-2 text-sm">{slot.sessionCount}</td>
                <td className="px-3 py-2 text-sm">
                  <button onClick={() => onRemoveSlot(slot.slotId)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                    <i className="fas fa-times"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <td colSpan="3" className="px-3 py-2 text-sm font-medium text-right">Total Timeslots</td>
              <td className="px-3 py-2 text-sm font-medium">{totalSessions}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

