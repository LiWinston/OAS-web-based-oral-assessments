"use client";

import clsx from "clsx";

const formatScore = (value) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return numeric.toFixed(1);
};

const formatName = (name) => {
  if (!name) return "—";
  return name;
};

export default function ExaminerTrendSummaryBanner({ summary, loading, deviationCount, status, threshold = 5 }) {
  const cohortAverage = summary?.cohort?.averageScore ?? 0;
  const examinerCount = summary?.cohort?.examinerCount ?? 0;
  const submissionCount = summary?.cohort?.submissionCount ?? 0;
  const hasMixedSubjects = Boolean(summary?.hasMixedSubjects);

  if (loading) {
    return (
      <section className="animate-pulse rounded-3xl bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 px-8 py-7 text-white shadow-lg">
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-3 w-24 rounded-full bg-white/30" />
              <div className="h-8 w-32 rounded-full bg-white/30" />
              <div className="h-4 w-20 rounded-full bg-white/20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const highest = summary?.extremes?.highest;
  const lowest = summary?.extremes?.lowest;

  const distributionContent = deviationCount > 0
    ? (
      <>
        <strong>{deviationCount}</strong> examiner{deviationCount === 1 ? "" : "s"} deviating more than <strong>{threshold}</strong> points.
      </>
    ) : (
      <>Score distribution looks balanced.</>
    );

  const statusMessage = status === "ALL"
    ? "Draft or rework attempts contribute to counts only; averages still reflect submitted marks."
    : "Counts and averages reflect submitted marks only.";

  return (
    <section className="rounded-3xl bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 px-8 py-7 text-white shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4 lg:max-w-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-100/70">Examiner Trends</p>
          <h1 className="text-3xl font-semibold">Spot outliers in examiner marking in seconds</h1>
          <p className="max-w-2xl text-sm text-blue-100/80">
            There are <strong>{examinerCount}</strong> examiner{examinerCount === 1 ? "" : "s"} contributing <strong>{submissionCount}</strong> submission{submissionCount === 1 ? "" : "s"}. Cohort average
            is <strong>{formatScore(cohortAverage)}</strong>. {distributionContent} {statusMessage}
          </p>
          {hasMixedSubjects && (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/90">
              Mixed cohort — individual and group marks are displayed together.
            </p>
          )}
        </div>

        <div className="flex max-w-md flex-wrap gap-4 lg:justify-end">
          <SummaryCard
            title="Highest average"
            name={formatName(highest?.examinerName)}
            score={formatScore(highest?.averageScore)}
            tone="from-emerald-400 to-emerald-600"
            icon="fa-arrow-trend-up"
          />
          <SummaryCard
            title="Lowest average"
            name={formatName(lowest?.examinerName)}
            score={formatScore(lowest?.averageScore)}
            tone="from-rose-400 to-rose-600"
            icon="fa-arrow-trend-down"
          />
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ title, name, score, tone, icon }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-100/80">{title}</p>
          <p className="mt-1 text-base font-semibold">{name}</p>
        </div>
        <div className={clsx("flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-lg shadow-lg", tone)}>
          <i className={clsx("fas", icon)} />
        </div>
      </div>
      <div className="mt-3 text-xs text-blue-100/70">Average score</div>
      <div className="text-2xl font-semibold">{score}</div>
    </div>
  );
}
