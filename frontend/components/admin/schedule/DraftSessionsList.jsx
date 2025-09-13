'use client';

export default function DraftSessionsList({ sessions = [], selectedIds = [], onToggleSelect, onDeleteOne }) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <i className="fas fa-calendar-plus text-xl" />
        </div>
        <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">No Sessions</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">Use "Batch Create" to add sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <div key={s.id} className="time-slot-item">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              {onToggleSelect && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(s.id)}
                  onChange={(e) => onToggleSelect(s.id, e.target.checked)}
                />
              )}
              <div>
                <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                  {s.date} • {s.startTime} – {s.endTime}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  <i className="fas fa-map-marker-alt mr-1.5" /> {s.venue}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-right">
              <div className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {s.assignedExaminers?.length || 0}/{s.requiredExaminers} examiners
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Capacity: {s.capacity || 1}</div>
              {onDeleteOne && (
                <button
                  className="action-btn text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:bg-red-900 dark:bg-opacity-20 dark:hover:bg-opacity-30"
                  onClick={() => onDeleteOne(s.id)}
                  title="Delete session"
                >
                  <i className="fas fa-trash-alt" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
