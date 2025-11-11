"use client";

import clsx from "clsx";

const formatNumber = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-AU").format(numeric);
};

const formatPercent = (value) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return `${Math.round(numeric * 100)}%`;
};

const formatScore = (value) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return `${numeric.toFixed(1)}%`;
};

const cardTone = {
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  sky: "text-sky-600",
  indigo: "text-indigo-600",
  purple: "text-purple-600",
  rose: "text-rose-600",
};

function SummaryCard({ icon, title, value, description, tone = "emerald", isLoading }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
          <i className={`fas ${icon}`} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">
          Snapshot
        </span>
      </div>
      <div
        className={clsx(
          "mt-5 text-3xl font-semibold",
          cardTone[tone] || cardTone.emerald,
          isLoading && "animate-pulse text-gray-300 dark:text-gray-600"
        )}
      >
        {isLoading ? "—" : value}
      </div>
      <div className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
      {description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );
}

export default function MarkConsolidationSummaryStrip({ overview, isLoading }) {
  const totals = overview?.totals ?? {};
  const progress = overview?.progress ?? {};
  const release = overview?.release ?? {};
  const examinerSubmissions = overview?.examinerSubmissions ?? {};
  const manualOverrides = overview?.manualOverrides ?? {};

  const ready = progress.ready ?? 0;
  const attention = progress.needsAttention ?? progress.attention ?? 0;
  const awaiting = progress.awaiting ?? progress.incomplete ?? 0;
  const participantTotal = totals.participants ?? ready + attention + awaiting;
  const submittedRatio = examinerSubmissions.submittedRatio;

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
      <SummaryCard
        icon="fa-clipboard-check"
        title="Ready for release"
        value={formatNumber(ready)}
        description={`of ${formatNumber(participantTotal)} participants`}
        tone="emerald"
        isLoading={isLoading}
      />
      <SummaryCard
        icon="fa-triangle-exclamation"
        title="Needs attention"
        value={formatNumber(attention)}
        description={attention > 0 ? "Follow up reopened submissions" : "All clear"}
        tone="amber"
        isLoading={isLoading}
      />
      <SummaryCard
        icon="fa-hourglass-half"
        title="Awaiting examiners"
        value={formatNumber(awaiting)}
        description={awaiting > 0 ? "Draft or missing examiner inputs" : "No outstanding submissions"}
        tone="sky"
        isLoading={isLoading}
      />
      <SummaryCard
        icon="fa-paper-plane"
        title="Marks released"
        value={formatNumber(release.released)}
        description={`${formatNumber(release.notReleased)} pending release`}
        tone="indigo"
        isLoading={isLoading}
      />
      <SummaryCard
        icon="fa-user-check"
        title="Examiner submissions"
        value={`${formatNumber(examinerSubmissions.submitted)} / ${formatNumber(examinerSubmissions.total)}`}
        description={`Completion rate ${submittedRatio !== null ? formatPercent(submittedRatio) : "—"}`}
        tone="purple"
        isLoading={isLoading}
      />
      <SummaryCard
        icon="fa-pen"
        title="Manual overrides"
        value={formatNumber(manualOverrides.count)}
        description={manualOverrides.lastUpdatedAt ? `Last change ${new Date(manualOverrides.lastUpdatedAt).toLocaleString("en-AU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}` : "No overrides applied"}
        tone="rose"
        isLoading={isLoading}
      />
    </div>
  );
}
