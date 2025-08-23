"use client";

import { useState, useEffect } from "react";
import { StatsCard, StatsCardSkeleton } from "../../ui/stats-card";

export function CourseOverviewStats() {
  const [stats, setStats] = useState({
    activeCourses: 5,
    totalStudents: 437,
    assignments: 24,
    currentSemester: "2025 S2",
  });
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const statsConfig = [
    {
      title: "Active Courses",
      value: stats.activeCourses,
      icon: "fa-book-open",
      bgColor: "from-blue-400 to-blue-600",
      shadowColor: "shadow-blue-500/30",
      iconBg: "bg-blue-500/20",
      hoverEffect: "hover:scale-105 hover:shadow-blue-500/40",
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: "fa-user-graduate",
      bgColor: "from-purple-400 to-purple-600",
      shadowColor: "shadow-purple-500/30",
      iconBg: "bg-purple-500/20",
      hoverEffect: "hover:scale-105 hover:shadow-purple-500/40",
    },
    {
      title: "Assignments",
      value: stats.assignments,
      icon: "fa-clipboard-check",
      bgColor: "from-green-400 to-green-600",
      shadowColor: "shadow-green-500/30",
      iconBg: "bg-green-500/20",
      hoverEffect: "hover:scale-105 hover:shadow-green-500/40",
    },
    {
      title: "Current Semester",
      value: stats.currentSemester,
      icon: "fa-calendar-alt",
      bgColor: "from-amber-400 to-amber-600",
      shadowColor: "shadow-amber-500/30",
      iconBg: "bg-amber-500/20",
      hoverEffect: "hover:scale-105 hover:shadow-amber-500/40",
    },
  ];

  if (loading) {
    return <StatsCardSkeleton count={4} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
          index={index}
        />
      ))}
    </div>
  );
}
