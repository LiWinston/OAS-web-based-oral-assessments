"use client";

import { StatsCard, StatsCardSkeleton } from "../../ui/stats-card";

export function AssignmentOverviewStats({ stats, loading }) {

  const statsConfig = [
    {
      title: "Total Assignments",
      value: stats.total,
      icon: "fa-tasks",
      bgColor: "from-blue-400 to-blue-600",
      shadowColor: "shadow-blue-500/30",
      iconBg: "bg-blue-500/20",
      hoverEffect: "hover:scale-105 hover:shadow-blue-500/40",
    },
    {
      title: "Active",
      value: stats.active,
      icon: "fa-play-circle",
      bgColor: "from-green-400 to-green-600",
      shadowColor: "shadow-green-500/30",
      iconBg: "bg-green-500/20",
      hoverEffect: "hover:scale-105 hover:shadow-green-500/40",
    },
    {
      title: "Upcoming",
      value: stats.upcoming,
      icon: "fa-clock",
      bgColor: "from-purple-400 to-purple-600",
      shadowColor: "shadow-purple-500/30",
      iconBg: "bg-purple-500/20",
      hoverEffect: "hover:scale-105 hover:shadow-purple-500/40",
    },
    {
      title: "Total Weight",
      value: `${stats.totalWeight}%`,
      icon: "fa-percentage",
      bgColor: "from-amber-400 to-amber-600",
      shadowColor: "shadow-amber-500/30",
      iconBg: "bg-amber-500/20",
      hoverEffect: "hover:scale-105 hover:shadow-amber-500/40",
      warning: stats.totalWeight !== 100 ? `Should equal 100%` : null,
      showProgress: true,
      progressValue: stats.totalWeight,
      progressLabel: "Weight Distribution",
    },
  ];

  if (loading) {
    return <StatsCardSkeleton count={4} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => (
        <StatsCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          bgColor={stat.bgColor}
          shadowColor={stat.shadowColor}
          iconBg={stat.iconBg}
          hoverEffect={stat.hoverEffect}
          warning={stat.warning}
          showProgress={stat.showProgress}
          progressValue={stat.progressValue}
          progressLabel={stat.progressLabel}
          index={index}
        />
      ))}
    </div>
  );
}
