"use client";

import { Button } from "@/components/ui/button";
import ReleaseStatusBadge from "@/components/admin/results/ReleaseStatusBadge.jsx";

const formatScore = (value) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "—";
};

export default function ScoreSummaryPanel({
  finalScore,
  releaseStatus = "NOT_RELEASED",
  releaseMode = 'FULL',
  onReleaseClick,
  canRelease = false,
  isReleasePending = false,
  actions,
}) {
  const normalizedMode = (releaseMode || '').toString().toUpperCase();
  const modeMeta = normalizedMode === 'SCORES_ONLY'
    ? { label: 'Scores only', helper: 'Students can see scores and overall feedback.' }
    : { label: 'Full release', helper: 'Students can see scores, comments, and overall feedback.' };

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-5 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Final score</div>
          <div className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{formatScore(finalScore)}</div>
          <ReleaseStatusBadge status={releaseStatus} />
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <i className="fas fa-layer-group text-[10px]" /> {modeMeta.label}
            </span>
            <span className="hidden sm:inline">· {modeMeta.helper}</span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          {actions}
          {onReleaseClick && (
            <Button
              onClick={onReleaseClick}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!canRelease || isReleasePending}
            >
              {isReleasePending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" /> Releasing…
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2" />
                  {releaseStatus === "RELEASED" ? "Re-release" : "Release results"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
