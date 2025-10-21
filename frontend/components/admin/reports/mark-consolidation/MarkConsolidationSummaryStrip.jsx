"use client";

const formatNumber = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-AU").format(numeric);
};

const formatScore = (value) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return `${numeric.toFixed(1)}%`;
};

function SummaryCard({ icon, label, value, sublabel, tone }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
          <i className={`fas ${icon}`} />
        </span>
        {sublabel && <span className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</span>}
      </div>
      <div className={`mt-4 text-3xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

export default function MarkConsolidationSummaryStrip({ summary }) {
  const ready = summary?.progress?.ready ?? 0;
  const attention = summary?.progress?.attention ?? 0;
  const incomplete = summary?.progress?.incomplete ?? 0;
  const released = summary?.release?.released ?? 0;
  const notReleased = summary?.release?.notReleased ?? 0;
  const total = summary?.total ?? ready + attention + incomplete;
  const manualOverrides = summary?.manualOverrides ?? 0;
  const examinerTotals = summary?.examinerTotals ?? {};
  const examinerSubmitted = examinerTotals.submitted ?? 0;
  const examinersTotal = examinerTotals.total ?? 0;
  const averageScore = summary?.averageFinalScore ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <SummaryCard
        icon="fa-clipboard-check"
        label="Ready for release"
        value={formatNumber(ready)}
        sublabel={`of ${formatNumber(total)} participants`}
        tone="text-emerald-600"
      />
      <SummaryCard
        icon="fa-bell-exclamation"
        label="Needs attention"
        value={formatNumber(attention)}
        sublabel={attention > 0 ? "Follow up reopened examiners" : "All clear"}
        tone="text-amber-600"
      />
      <SummaryCard
        icon="fa-hourglass-half"
        label="Awaiting submissions"
        value={formatNumber(incomplete)}
        sublabel={incomplete > 0 ? "Draft or missing examiner inputs" : "None pending"}
        tone="text-sky-600"
      />
      <SummaryCard
        icon="fa-paper-plane"
        label="Released"
        value={`${formatNumber(released)}`}
        sublabel={`${formatNumber(notReleased)} not yet released`}
        tone="text-indigo-600"
      />
      <SummaryCard
        icon="fa-graduation-cap"
        label="Average final score"
        value={formatScore(averageScore)}
        sublabel={`${formatNumber(examinerSubmitted)} of ${formatNumber(examinersTotal)} examiner submissions`}
        tone="text-purple-600"
      />
      <SummaryCard
        icon="fa-pen"
        label="Manual overrides"
        value={formatNumber(manualOverrides)}
        sublabel="Applied by admins"
        tone="text-rose-600"
      />
    </div>
  );
}
