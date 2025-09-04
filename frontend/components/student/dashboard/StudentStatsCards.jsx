"use client";

import { StatsCard } from "../../ui/stats-card";

/**
 * StudentStatsCards Component
 *
 * Displays key statistics for the student dashboard using the shared StatsCard component.
 * Follows the same patterns as examiner and admin dashboards for consistency.
 */
export function StudentStatsCards() {
  // Mock data - will be replaced with real data from API
  const stats = [
    {
      title: "Total Assessments",
      value: "6",
      icon: "fa-tasks",
      bgColor: "from-blue-500 to-blue-600",
      shadowColor: "hover:shadow-blue-200 dark:hover:shadow-blue-900/50",
      iconBg: "bg-blue-100 dark:bg-blue-800",
      hoverEffect: "hover:-translate-y-1 hover:shadow-xl",
      actionText: "View Bookings",
      actionHref: "/student/booking",
      index: 0,
    },
    {
      title: "Upcoming",
      value: "3",
      icon: "fa-calendar-plus",
      bgColor: "from-orange-500 to-orange-600",
      shadowColor: "hover:shadow-orange-200 dark:hover:shadow-orange-900/50",
      iconBg: "bg-orange-100 dark:bg-orange-800",
      hoverEffect: "hover:-translate-y-1 hover:shadow-xl",
      actionText: "Book Now",
      actionHref: "/student/booking",
      index: 1,
    },
    {
      title: "Completed",
      value: "2",
      icon: "fa-check-circle",
      bgColor: "from-green-500 to-green-600",
      shadowColor: "hover:shadow-green-200 dark:hover:shadow-green-900/50",
      iconBg: "bg-green-100 dark:bg-green-800",
      hoverEffect: "hover:-translate-y-1 hover:shadow-xl",
      actionText: "View Results",
      actionHref: "/student/results",
      index: 2,
    },
    {
      title: "Groups",
      value: "2",
      icon: "fa-users",
      bgColor: "from-purple-500 to-purple-600",
      shadowColor: "hover:shadow-purple-200 dark:hover:shadow-purple-900/50",
      iconBg: "bg-purple-100 dark:bg-purple-800",
      hoverEffect: "hover:-translate-y-1 hover:shadow-xl",
      actionText: "View Groups",
      actionHref: "/student/groups",
      index: 3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          bgColor={stat.bgColor}
          shadowColor={stat.shadowColor}
          iconBg={stat.iconBg}
          hoverEffect={stat.hoverEffect}
          warning={stat.warning}
          actionText={stat.actionText}
          actionHref={stat.actionHref}
          index={stat.index}
        />
      ))}
    </div>
  );
}
