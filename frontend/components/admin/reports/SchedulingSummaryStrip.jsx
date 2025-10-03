'use client';

import { cn } from '@/lib/utils.js';

const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'window', label: 'Exam Window' },
  { id: 'custom', label: 'Custom Range' },
];

const defaultSummary = {
  totalSessions: 0,
  fullyStaffed: 0,
  partiallyStaffed: 0,
  unstaffed: 0,
  totalRequiredExaminers: 0,
  totalAssignedExaminers: 0,
  totalCapacity: 0,
  totalBooked: 0,
};

const calcBookingRatio = (summary) => {
  if (!summary.totalCapacity || summary.totalCapacity <= 0) return 0;
  return Math.min(1, (summary.totalBooked || 0) / summary.totalCapacity);
};

export default function SchedulingSummaryStrip({
  summary,
  publishStatus,
  selectedDate,
  preset,
  onPresetChange,
}) {
  const merged = { ...defaultSummary, ...(summary || {}) };
  const gaps = (merged.partiallyStaffed || 0) + (merged.unstaffed || merged.noStaffed || 0);
  const bookingRatio = calcBookingRatio(merged);

  const bookingLabel = bookingRatio >= 0.95
    ? 'Critical demand'
    : bookingRatio >= 0.8
      ? 'High demand'
      : bookingRatio >= 0.5
        ? 'Steady bookings'
        : 'Plenty of capacity';

  const bookingTone = bookingRatio >= 0.95
    ? 'text-red-600'
    : bookingRatio >= 0.8
      ? 'text-amber-600'
      : 'text-emerald-600';

  const publishBadges = [
    {
      label: 'Examiners',
      active: publishStatus?.examiners,
      icon: publishStatus?.examiners ? 'fa-user-check' : 'fa-user-clock',
    },
    {
      label: 'Students',
      active: publishStatus?.students,
      icon: publishStatus?.students ? 'fa-door-open' : 'fa-door-closed',
    },
  ];

  const insightMessage = gaps === 0
    ? 'All sessions fully staffed. Great job!'
    : gaps === 1
      ? '1 session needs examiner attention.'
      : `${gaps} sessions need examiner attention.`;

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-800/80">
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.4em] text-blue-500 dark:text-blue-300">
            Scheduling Insights
            {selectedDate && (
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-semibold normal-case tracking-[0.2em] text-blue-600 dark:text-blue-300">
                {selectedDate}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {insightMessage}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-300">
              {merged.fullyStaffed} fully staffed
            </span>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700 dark:text-amber-300">
              {merged.partiallyStaffed} partial
            </span>
            <span className="rounded-full bg-rose-500/10 px-3 py-1 font-medium text-rose-700 dark:text-rose-300">
              {merged.unstaffed || merged.noStaffed || 0} unstaffed
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  preset === option.id
                    ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
                onClick={() => onPresetChange?.(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
            {publishBadges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium',
                  badge.active
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400'
                )}
              >
                <i className={`fas ${badge.icon}`} />
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-[160px] rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-center dark:border-blue-900/40 dark:bg-blue-900/40">
          <div className="text-[11px] uppercase tracking-[0.3em] text-blue-500/80">Booking Load</div>
          <div className="text-2xl font-semibold text-blue-700 dark:text-blue-200">
            {Math.round(bookingRatio * 100)}%
          </div>
          <div className={cn('text-xs font-medium', bookingTone)}>{bookingLabel}</div>
        </div>
      </div>
    </div>
  );
}

export const schedulingSummaryPresets = PRESETS;

