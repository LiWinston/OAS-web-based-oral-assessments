'use client';

export default function VersionsTimeline({ versions = [], onSelectVersion }) {
  if (!versions?.length) return <div className="text-sm text-gray-500 dark:text-gray-400">No submitted versions yet.</div>;
  return (
    <div className="relative pl-4">
      <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      <ul className="space-y-4">
        {versions.map((v) => (
          <li key={v.version} className="relative">
            <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-blue-500" />
            <button onClick={() => onSelectVersion?.(v.version)} className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-900/40">
              <div className="flex justify-between items-center">
                <div className="font-medium">Revision {v.version} • {v.status}</div>
                <div className="text-xs text-gray-500">{new Date(v.at).toLocaleString('en-AU')}</div>
              </div>
              {v?.summary?.examinerScorePct1dp != null && (
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Your score: {v.summary.examinerScorePct1dp}%</div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
