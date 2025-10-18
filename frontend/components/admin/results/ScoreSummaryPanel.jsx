"use client";

import { Button } from "@/components/ui/button";

const formatPct = (value) => {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(1)}%`;
};

export default function ScoreSummaryPanel({
  computed,
  releaseStatus,
  onReleaseClick,
  canRelease,
  isReleasePending = false,
}) {
  return (
    <div className="dashboard-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Aggregate score</div>
          <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{formatPct(computed?.averageScorePct1dp)}</div>
        </div>

        <div className="flex items-center gap-3">
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
