"use client";

import { Button } from "@/components/ui/button";

const formatPct = (value) => {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(1)}%`;
};

export default function ScoreSummaryPanel({
  computed,
  releaseStatus,
  onOverrideClick,
  onReleaseClick,
  canRelease,
  isOverridePending = false,
  isReleasePending = false,
}) {
  const manual = computed?.manualOverride;
  return (
    <div className="dashboard-card p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Average (submitted examiners)</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatPct(computed?.averageScorePct1dp)}</div>
          </div>
          <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Final score</span>
              {manual && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200">
                  Overridden
                </span>
              )}
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatPct(computed?.effectiveFinalScorePct1dp)}</div>
            {manual?.reason && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Moderated: {manual.reason}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onOverrideClick} disabled={isOverridePending}>
            {isOverridePending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" /> Saving…
              </>
            ) : (
              <>
                <i className="fas fa-pen-to-square mr-2" /> Set Final Score
              </>
            )}
          </Button>
          <Button
            onClick={onReleaseClick}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!canRelease || isReleasePending}
            title={canRelease ? 'Release to students' : 'At least one examiner must be submitted before release'}
          >
            {isReleasePending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" /> Releasing…
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2" />
                {releaseStatus === 'RELEASED' ? 'Re-release' : 'Release Results'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
