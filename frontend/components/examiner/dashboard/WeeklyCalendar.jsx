"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

const statusStyles = {
  IN_PROGRESS: "bg-green-100/90 dark:bg-green-900/40 text-green-800 dark:text-green-200",
  UPCOMING: "bg-blue-100/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  DRAFT: "bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
  REOPENED: "bg-rose-100/80 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200",
  UNMARKED: "bg-orange-100/80 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  COMPLETED: "bg-gray-100/80 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200",
};

const viewOptions = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

function renderSkeletonWeek() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
      {Array.from({ length: 7 }).map((_, idx) => (
        <div
          key={`calendar-skeleton-${idx}`}
          className="h-full rounded-2xl border border-gray-200/70 bg-gray-100/70 p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/40 animate-pulse"
        >
          <div className="h-4 w-16 rounded bg-gray-300 dark:bg-gray-700" />
          <div className="mt-2 h-3 w-12 rounded bg-gray-300 dark:bg-gray-700" />
          <div className="mt-4 space-y-2">
            <div className="h-8 rounded bg-gray-300/80 dark:bg-gray-800" />
            <div className="h-8 rounded bg-gray-300/80 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EventBadge({ event }) {
  const pillClass =
    statusStyles[event.markingStatus] ??
    statusStyles[event.status] ??
    statusStyles.UPCOMING;

  return (
    <div
      key={event.id}
      className={cn(
        "rounded-xl px-3 py-2 text-xs shadow-sm transition-colors",
        pillClass
      )}
    >
      <div className="font-semibold truncate">{event.title}</div>
      <div className="mt-1 flex items-center justify-between text-[11px] opacity-85">
        <span>{event.timeLabel}</span>
        {event.markingLabel && <span>{event.markingLabel}</span>}
      </div>
    </div>
  );
}

function MonthGrid({ month }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div
          key={day}
          className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 px-2"
        >
          {day}
        </div>
      ))}

      {month.map((week, wIndex) =>
        week.map((day) => (
          <div
            key={`${wIndex}-${day.dateKey}`}
            className={cn(
              "min-h-[120px] rounded-2xl border p-3 transition-all",
              day.isToday
                ? "border-blue-400 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-900/30"
                : day.isCurrentMonth
                ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40"
                : "border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20"
            )}
          >
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span
                className={cn(
                  "font-medium",
                  !day.isCurrentMonth && "opacity-60",
                  day.isToday && "text-blue-600 dark:text-blue-300"
                )}
              >
                {day.displayDate}
              </span>
              {day.events.length > 0 && (
                <span className="text-[10px] font-semibold uppercase text-blue-500">
                  {day.events.length}
                </span>
              )}
            </div>
            <div className="mt-2 space-y-2">
              {day.events.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium shadow-sm",
                    statusStyles[event.markingStatus] ??
                      statusStyles[event.status] ??
                      statusStyles.UPCOMING
                  )}
                >
                  <div className="truncate">{event.title}</div>
                  <div className="text-[10px] opacity-80">
                    {event.timeLabel}
                  </div>
                </div>
              ))}
              {day.events.length > 2 && (
                <div className="text-[11px] font-medium text-blue-600 dark:text-blue-300">
                  +{day.events.length - 2} more
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function WeeklyCalendar({
  week = [],
  month = [],
  view = "week",
  onViewChange,
  isLoading = false,
}) {
  const handleViewChange = (value) => {
    if (value !== view) {
      onViewChange?.(value);
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-week text-purple-600 dark:text-purple-400 mr-2" />
            Examiner Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-100/70 p-1 dark:border-gray-700 dark:bg-gray-800/60">
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleViewChange(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    view === option.value
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-50"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading && renderSkeletonWeek()}

        {!isLoading && view === "week" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
              {week.map((day) => (
                <div
                  key={day.dateKey}
                  className={cn(
                    "flex h-full flex-col rounded-2xl border p-4 shadow-sm transition-colors",
                    day.isToday
                      ? "border-blue-400 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-900/25"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40"
                  )}
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold uppercase tracking-wide">
                      {day.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        day.isToday
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-200"
                          : "text-gray-400"
                      )}
                    >
                      {day.displayDate}
                    </span>
                  </div>
                  <div className="mt-3 flex-1 space-y-2">
                    {day.events.length === 0 && (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
                        No sessions
                      </div>
                    )}
                    {day.events.map((event) => (
                      <EventBadge key={`${day.dateKey}-${event.id}`} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {week.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No scheduled sessions in the next 7 days.
              </div>
            )}
          </>
        )}

        {!isLoading && view === "month" && (
          <>
            <MonthGrid month={month} />
            {month.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No sessions scheduled this month.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
