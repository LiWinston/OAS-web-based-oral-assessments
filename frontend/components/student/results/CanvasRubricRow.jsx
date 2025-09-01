'use client';

import { useRef, useCallback, useState } from 'react';
import RubricLevelCell from './RubricLevelCell';
import ExaminerChip from './ExaminerChip';

export default function CanvasRubricRow({
  criterion,
  levels = [],
  showExaminerDetails = true,
}) {
  const percentage = Math.round(
    ((criterion?.earnedPoints || 0) / Math.max(1, criterion?.maxPoints || 1)) * 100
  );

  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const inRange = (points, l) => typeof points === 'number' && l && typeof l.minPoints === 'number' && typeof l.maxPoints === 'number'
    ? points >= l.minPoints && points <= l.maxPoints
    : false;
  const nearestIndexByPoints = (points) => {
    if (!levels || !levels.length || typeof points !== 'number') return -1;
    let best = -1;
    let bestDist = Infinity;
    levels.forEach((l, idx) => {
      const mid = ((l?.minPoints || 0) + (l?.maxPoints || 0)) / 2;
      const dist = Math.abs(points - mid);
      if (dist < bestDist) { bestDist = dist; best = idx; }
    });
    return best;
  };
  const findIndex = (label, points) => {
    if (label) {
      const t = norm(label);
      const i = levels.findIndex((l) => norm(l?.label) === t);
      if (i >= 0) return i;
    }
    if (typeof points === 'number') {
      const r = levels.findIndex((l) => inRange(points, l));
      if (r >= 0) return r;
      return nearestIndexByPoints(points);
    }
    return -1;
  };

  const aggregatedIndex = findIndex(null, criterion?.earnedPoints);
  const byExaminer = (criterion?.examinerScores || []).map((s) => ({
    examinerId: s.examinerId,
    name: s.examinerName,
    levelIndex: findIndex(s.level, s.points),
  }));

  // Keyboard navigation across level cells
  const levelRefs = useRef([]);
  const [showLevelDetails, setShowLevelDetails] = useState(false);
  const handleKeyDown = useCallback((e) => {
    const key = e.key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
    const target = e.target;
    const idx = Number(target?.dataset?.levelIndex ?? -1);
    if (Number.isNaN(idx) || idx < 0) return;
    e.preventDefault();
    const nextIdx = key === 'ArrowLeft' ? idx - 1 : idx + 1;
    const next = levelRefs.current?.[nextIdx];
    if (next && typeof next.focus === 'function') {
      next.focus();
    }
  }, []);

  const LevelDetailsToggle = () => (
    <button
      type="button"
      className="ml-auto text-xs text-gray-600 dark:text-gray-300 hover:underline"
      onClick={() => setShowLevelDetails((v) => !v)}
      aria-pressed={showLevelDetails}
    >
      {showLevelDetails ? 'Hide details' : 'Show details'}
    </button>
  );

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
      {/* Top row: left meta, middle level grid, right points */}
      <div className="grid gap-3 p-3 md:grid-cols-12">
        {/* Left: criterion meta */}
        <div className="md:col-span-4">
          <div className="font-semibold text-gray-900 dark:text-white">{criterion?.name}</div>
          {criterion?.description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {criterion.description}
            </div>
          )}
          {typeof criterion?.weight === 'number' && (
            <div className="text-xs text-gray-500 mt-1">Weight: {criterion.weight}%</div>
          )}
        </div>

        {/* Middle: dynamic level grid */}
        <div className="md:col-span-6">
          <div className="flex items-center justify-between mb-1">
            <span className="sr-only">Level details toggle</span>
            <LevelDetailsToggle />
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, levels.length || 1)}, minmax(0, 1fr))` }}
            role="grid"
            aria-label="Rubric levels"
            onKeyDown={handleKeyDown}
          >
            {(levels?.length ? levels : []).map((lvl, idx) => (
              <RubricLevelCell
                key={lvl.id || idx}
                level={lvl}
                selectedAggregated={idx === aggregatedIndex}
                selectedByExaminers={byExaminer
                  .filter((x) => x.levelIndex === idx)
                  .map((x) => ({ name: x.name }))}
                cellRef={(el) => (levelRefs.current[idx] = el)}
                levelIndex={idx}
                expanded={showLevelDetails}
              />
            ))}
            {(!levels || levels.length === 0) && (
              <div className="text-sm text-gray-500">No scale available</div>
            )}
          </div>
          {/* Mixed indicator when examiner selections differ */}
          {(() => {
            const set = new Set(byExaminer.map((x) => x.levelIndex).filter((i) => i >= 0));
            return set.size > 1 ? (
              <div className="mt-1 text-xs text-gray-500">Mixed ratings from examiners</div>
            ) : null;
          })()}
        </div>

        {/* Right: points */}
        <div className="md:col-span-2 text-right">
          <div className="font-semibold text-gray-900 dark:text-white">
            {criterion?.earnedPoints}/{criterion?.maxPoints}
          </div>
          <div className="text-xs text-gray-500">{percentage}%</div>
        </div>
      </div>

      {/* Bottom rows: examiner details + comments */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
        {showExaminerDetails && (criterion?.examinerScores?.length > 0) && (
          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Examiner marks</div>
            <div className="grid gap-2 md:grid-cols-2">
              {criterion.examinerScores.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <ExaminerChip name={s.examinerName} />
                    <div className="text-sm">
                      {s.level && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">{s.level}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{s.points}</div>
                    <div className="text-xs text-gray-500">/{criterion?.maxPoints}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {criterion?.comments?.length > 0 && (
          <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Feedback</div>
            <div className="space-y-1">
              {criterion.comments.map((c, idx) => (
                <div key={idx} className="text-sm text-blue-900 dark:text-blue-100">{c}</div>
              ))}
            </div>
          </div>
        )}

        {criterion?.criterionId && (
          <div>
            <a
              href={`#criterion-${criterion.criterionId}-fb`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View related feedback
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
