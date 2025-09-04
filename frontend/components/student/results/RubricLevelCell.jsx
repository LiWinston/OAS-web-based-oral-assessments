'use client';

import { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Info } from 'lucide-react';

export default function RubricLevelCell({
  level,
  selectedAggregated = false,
  selectedByExaminers = [],
  cellRef,
  levelIndex,
  expanded = false,
}) {
  const { label, minPoints, maxPoints, description } = level || {};
  const selected = selectedAggregated || (selectedByExaminers?.length > 0);
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        'relative p-3 border rounded-md text-sm transition-all',
        'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
        selected && 'ring-2 ring-blue-500/60 shadow-sm'
      )}
      title={description || `${label} (${minPoints}-${maxPoints} pts)`}
      aria-selected={selected}
      role="gridcell"
      tabIndex={0}
      ref={cellRef}
      data-level-index={levelIndex}
    >
      <div className="font-medium text-gray-900 dark:text-white truncate">{label}</div>
      <div className="text-xs text-gray-500">{minPoints}-{maxPoints} pts</div>
      {/* Description area */}
      {description && (
        expanded ? (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {description}
          </div>
        ) : (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <span className="truncate" title={description}>{description}</span>
            <button
              type="button"
              className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Show full description"
              onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
              onBlur={() => setOpen(false)}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {/* Examiner chips */}
      {selectedByExaminers?.length > 0 && (
        <div className="mt-1 flex -space-x-1">
          {selectedByExaminers.slice(0, 3).map((ex, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white dark:border-gray-900"
              title={ex.name}
            >
              {ex.name?.charAt(0).toUpperCase() || 'E'}
            </div>
          ))}
          {selectedByExaminers.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[10px] font-semibold flex items-center justify-center border-2 border-white dark:border-gray-900">
              +{selectedByExaminers.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Popover for full description (compact mode) */}
      {open && !expanded && description && (
        <div
          className="absolute z-20 left-2 right-2 top-full mt-2 p-3 text-xs rounded-md border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg"
          role="dialog"
        >
          <div className="font-medium text-gray-900 dark:text-white mb-1">{label}</div>
          <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{description}</div>
        </div>
      )}
    </div>
  );
}
