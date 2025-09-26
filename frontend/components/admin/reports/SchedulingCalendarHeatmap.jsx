'use client';

import { useMemo } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const clampMonth = (value) => {
  if (!value) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return value;
};

const buildCalendarDays = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthDays = new Date(prevYear, prevMonth, 0).getDate();
    const day = prevMonthDays - firstDay + i + 1;
    cells.push({
      date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      display: day,
      current: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      display: day,
      current: true,
    });
  }

  const totalCells = Math.ceil(cells.length / 7) * 7;
  const nextCellsNeeded = totalCells - cells.length;
  for (let i = 1; i <= nextCellsNeeded; i += 1) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    cells.push({
      date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      display: i,
      current: false,
    });
  }

  return cells;
};

const getSegments = (dataForDay) => {
  if (!dataForDay) return [];
  const { fullyStaffed = 0, partialStaffed = 0, noStaffed = 0 } = dataForDay;
  const total = fullyStaffed + partialStaffed + noStaffed;
  if (total === 0) return [];
  return [
    { key: 'fully', value: fullyStaffed, className: 'bg-emerald-400/80 dark:bg-emerald-500/70' },
    { key: 'partial', value: partialStaffed, className: 'bg-amber-400/80 dark:bg-amber-500/80' },
    { key: 'none', value: noStaffed, className: 'bg-rose-400/80 dark:bg-rose-500/70' },
  ].filter((segment) => segment.value > 0)
    .map((segment) => ({
      ...segment,
      width: `${Math.max(8, (segment.value / total) * 100)}%`,
    }));
};

export default function SchedulingCalendarHeatmap({
  month,
  data,
  selectedDate,
  onChangeMonth,
  onSelectDate,
  isLoading = false,
}) {
  const resolvedMonth = clampMonth(month);
  const [year, monthIndex] = resolvedMonth.split('-').map(Number);
  const calendarCells = useMemo(() => buildCalendarDays(year, monthIndex), [year, monthIndex]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const monthLabel = `${MONTH_NAMES[(monthIndex - 1 + 12) % 12]} ${year}`;

  const handleMonthShift = (direction) => {
    const base = new Date(year, monthIndex - 1, 1);
    base.setMonth(base.getMonth() + (direction === 'next' ? 1 : -1));
    const nextValue = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
    onChangeMonth?.(nextValue);
  };

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">Staffing Heatmap</p>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{monthLabel}</h2>
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-blue-500"></span>
                Updating
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMonthShift('prev')}
            className="rounded-full border border-gray-200 dark:border-gray-700 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Previous month"
          >
            <i className="fas fa-chevron-left" />
          </button>
          <button
            type="button"
            onClick={() => handleMonthShift('next')}
            className="rounded-full border border-gray-200 dark:border-gray-700 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Next month"
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <div key={label} className="pb-2">{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-sm">
        {calendarCells.map((cell) => {
          const isCurrentMonth = cell.current;
          const cellData = data?.[cell.date];
          const segments = getSegments(cellData);
          const isSelected = selectedDate === cell.date;
          const isToday = todayKey === cell.date;
          const totalSessions = (cellData?.fullyStaffed || 0) + (cellData?.partialStaffed || 0) + (cellData?.noStaffed || 0);

          const baseClasses = [
            'rounded-2xl border p-2 text-left transition-colors min-h-[76px]',
            isCurrentMonth
              ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              : 'border-dashed border-gray-200/60 bg-gray-50 text-gray-300 dark:border-gray-700/60 dark:bg-gray-900/40 dark:text-gray-600',
            isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-200/30' : '',
            isToday ? 'border-blue-400 dark:border-blue-500' : '',
            isCurrentMonth ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : 'cursor-not-allowed',
          ];

          const ariaLabelParts = [
            `${cell.date}`,
            `${cellData?.fullyStaffed || 0} fully staffed`,
            `${cellData?.partialStaffed || 0} partially staffed`,
            `${cellData?.noStaffed || 0} unstaffed`,
          ];

          return (
            <button
              key={cell.date}
              type="button"
              className={baseClasses.filter(Boolean).join(' ')}
              onClick={() => isCurrentMonth && onSelectDate?.(cell.date)}
              aria-pressed={isSelected}
              aria-label={ariaLabelParts.join(' · ')}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={isCurrentMonth ? 'text-gray-700 dark:text-gray-100' : ''}>{cell.display}</span>
                {totalSessions > 0 && isCurrentMonth && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {totalSessions} session{totalSessions === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <div className="mt-2">
                {segments.length > 0 ? (
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    {segments.map((segment) => (
                      <div
                        key={segment.key}
                        className={segment.className}
                        style={{ width: segment.width }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700" />
                )}
              </div>
              {segments.length > 0 && (
                <div className="mt-2 space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {cellData?.fullyStaffed > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {cellData.fullyStaffed} fully staffed
                    </div>
                  )}
                  {cellData?.partialStaffed > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {cellData.partialStaffed} partial
                    </div>
                  )}
                  {cellData?.noStaffed > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
                      {cellData.noStaffed} unstaffed
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> Fully staffed
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> Partially staffed
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-400" /> Unstaffed
        </div>
      </div>
    </div>
  );
}

