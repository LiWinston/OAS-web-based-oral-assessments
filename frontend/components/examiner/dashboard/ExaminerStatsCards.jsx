"use client";

import { cn } from "@/lib/utils";

const defaultStats = {
  sessionsToday: 0,
  pendingMarking: 0,
  pendingDueToday: 0,
  submittedThisWeek: 0,
  studentsAssessedWeek: 0,
};

const metricConfigs = [
  {
    key: "sessionsToday",
    title: "Today's Sessions",
    icon: "fa-calendar-day",
    accent: "bg-blue-50 dark:bg-blue-900/20",
    iconBg: "bg-blue-100 dark:bg-blue-800",
    iconClass: "text-blue-600 dark:text-blue-400",
    description: (stats) =>
      `${stats.sessionsToday === 1 ? "1 session" : `${stats.sessionsToday} sessions`} scheduled`,
    highlight: (stats) =>
      stats.sessionsToday > 0
        ? `${stats.sessionsToday} starting today`
        : "No sessions today",
    highlightClass: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "pendingMarking",
    title: "Pending Marking",
    icon: "fa-clipboard-list",
    accent: "bg-red-50 dark:bg-red-900/20",
    iconBg: "bg-red-100 dark:bg-red-800",
    iconClass: "text-red-600 dark:text-red-400",
    description: (stats) =>
      `${stats.pendingMarking === 1 ? "1 session" : `${stats.pendingMarking} sessions`} awaiting feedback`,
    highlight: (stats) =>
      stats.pendingDueToday > 0
        ? `${stats.pendingDueToday} due today`
        : "All caught up",
    highlightClass: "text-red-600 dark:text-red-400",
  },
  {
    key: "submittedThisWeek",
    title: "Submitted This Week",
    icon: "fa-check-circle",
    accent: "bg-green-50 dark:bg-green-900/20",
    iconBg: "bg-green-100 dark:bg-green-800",
    iconClass: "text-green-600 dark:text-green-400",
    description: (stats) =>
      `${stats.submittedThisWeek === 1 ? "1 submission" : `${stats.submittedThisWeek} submissions`} lodged`,
    highlight: () => "Great work!",
    highlightClass: "text-green-600 dark:text-green-400",
  },
  {
    key: "studentsAssessedWeek",
    title: "Students Assessed (7d)",
    icon: "fa-users",
    accent: "bg-purple-50 dark:bg-purple-900/20",
    iconBg: "bg-purple-100 dark:bg-purple-800",
    iconClass: "text-purple-600 dark:text-purple-400",
    description: (stats) =>
      `${stats.studentsAssessedWeek === 1 ? "1 learner" : `${stats.studentsAssessedWeek} learners`} assessed`,
    highlight: () => "Includes groups & individuals",
    highlightClass: "text-purple-600 dark:text-purple-400",
  },
];

export function ExaminerStatsCards({ stats = defaultStats, isLoading = false }) {
  const metricValues = { ...defaultStats, ...(stats || {}) };

  return (
    <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 xl:grid-cols-4">
      {metricConfigs.map((metric) => {
        const accentClasses = cn(
          "flex items-start gap-4 p-5 h-full",
          metric.accent
        );
        return (
          <div
            key={metric.key}
            className="h-full rounded-2xl border border-gray-200/80 bg-transparent shadow-sm dark:border-gray-800/80 dark:shadow-sm overflow-hidden"
          >
            <div className={accentClasses}>
              <div className={cn("flex size-12 items-center justify-center rounded-2xl font-semibold", metric.iconBg)}>
                <i className={cn("fas", metric.icon, "text-lg", metric.iconClass)}></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {metric.title}
                </h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? (
                    <span className="inline-flex h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></span>
                  ) : (
                    metricValues[metric.key] ?? 0
                  )}
                </div>
                <div className="text-xs text-gray-600/80 dark:text-gray-400">
                  {isLoading ? (
                    <span className="inline-flex h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></span>
                  ) : (
                    metric.description(metricValues)
                  )}
                </div>
                <div className={cn("text-xs font-semibold", metric.highlightClass)}>
                  {isLoading ? (
                    <span className="inline-flex h-4 w-24 animate-pulse rounded bg-current/20"></span>
                  ) : (
                    metric.highlight(metricValues)
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
