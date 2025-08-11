'use client';

import { StatsCard } from '../dashboard/StatsCard';

export function CourseOverviewStats() {
  // Mock data - in real app, this would come from API
  const stats = {
    activeCourses: {
      value: "5",
      subtitle: "2 new this year",
      trend: "up",
      icon: "fas fa-book-open"
    },
    totalStudents: {
      value: "437",
      subtitle: "Across all courses",
      trend: "neutral",
      icon: "fas fa-user-graduate"
    },
    assignments: {
      value: "24",
      subtitle: "8 active assignments",
      trend: "neutral", 
      icon: "fas fa-clipboard-check"
    },
    currentSemester: {
      value: "2025 S2",
      subtitle: "Planning mode",
      trend: "neutral",
      icon: "fas fa-calendar-alt"
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Courses */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Active Courses
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.activeCourses.value}
          </div>
          <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
            <i className="fas fa-arrow-up mr-1"></i> {stats.activeCourses.subtitle}
          </div>
        </div>

        {/* Total Students */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Students
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.totalStudents.value}
          </div>
          <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
            <i className="fas fa-users mr-1"></i> {stats.totalStudents.subtitle}
          </div>
        </div>

        {/* Assignments */}
        <div className="p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Assignments
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.assignments.value}
          </div>
          <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
            <i className="fas fa-calendar-check mr-1"></i> {stats.assignments.subtitle}
          </div>
        </div>

        {/* Current Semester */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900 dark:bg-opacity-20 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current Semester
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.currentSemester.value}
          </div>
          <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
            <i className="fas fa-clock mr-1"></i> {stats.currentSemester.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}