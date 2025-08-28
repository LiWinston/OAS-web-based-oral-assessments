"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { StatsCard, StatsCardSkeleton } from "../../ui/stats-card";
import { courseService } from "../../../services/courseService";

export const CourseOverviewStats = forwardRef(function CourseOverviewStats(props, ref) {
  const [stats, setStats] = useState({
    activeCourses: 0,
    totalStudents: 0,
    assignments: 0,
    currentSemester: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshStats: fetchCourseStats
  }));

  // Fetch course statistics from API
  useEffect(() => {
    fetchCourseStats();
  }, []);

  const fetchCourseStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await courseService.getCourseStats();
      
      if (result.success && result.data) {
        setStats({
          activeCourses: result.data.activeCourses || 0,
          totalStudents: result.data.totalStudents || 0,
          assignments: result.data.totalAssignments || 0,
          currentSemester: result.data.currentSemester || "2025 S2",
        });
      } else {
        setError(result.message || 'Failed to fetch course statistics');
        // Set default values
        setStats({
          activeCourses: 0,
          totalStudents: 0,
          assignments: 0,
          currentSemester: "2025 S2",
        });
      }
    } catch (error) {
      console.error('Error fetching course stats:', error);
      setError('Failed to load course statistics');
      // Set default values
      setStats({
        activeCourses: 0,
        totalStudents: 0,
        assignments: 0,
        currentSemester: "2025 S2",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <StatsCardSkeleton count={4} />;
  }

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

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statsConfig.map((stat, index) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center mr-4`}>
                <i className={`${stat.icon} text-lg text-gray-600 dark:text-gray-400`}></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div className="col-span-full text-center text-red-600 dark:text-red-400 text-sm">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      </div>
    );
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
});
