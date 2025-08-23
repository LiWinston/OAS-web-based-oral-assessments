"use client";

import { Card, CardContent } from "../../ui/card";

/**
 * Mock statistics data for examiner dashboard metrics
 */
const mockStats = {
  todayCount: 3,
  todayChange: 2,
  pendingCount: 8,
  pendingDueToday: 5,
  completedThisWeek: 12,
  completionRate: 85,
  studentsAssessed: 48,
  coursesCount: 5,
};

/**
 * ExaminerStatsCards Component
 *
 * Displays key performance metrics for examiners in a responsive card grid.
 * Each card shows a specific metric with visual indicators, trends, and contextual information.
 */
export function ExaminerStatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Today's Assessments */}
      <Card className="dashboard-card">
        <CardContent className="p-0">
          <div className="stats-card bg-blue-50 dark:bg-blue-900/20">
            <div className="stats-icon bg-blue-100 dark:bg-blue-800">
              <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400"></i>
            </div>
            <div className="">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">
                Today's Assessments
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {mockStats.todayCount}
              </div>
              <div className="flex items-center mt-1 text-xs">
                <span className="text-green-600 dark:text-green-400">
                  <i className="fas fa-arrow-up mr-1"></i>{" "}
                  {mockStats.todayChange} more
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  than yesterday
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Feedback */}
      <Card className="dashboard-card">
        <CardContent className="p-0">
          <div className="stats-card bg-red-50 dark:bg-red-900/20">
            <div className="stats-icon bg-red-100 dark:bg-red-800">
              <i className="fas fa-clipboard-list text-red-600 dark:text-red-400"></i>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">
                Pending Feedback
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {mockStats.pendingCount}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                <i className="fas fa-exclamation-circle mr-1"></i>{" "}
                {mockStats.pendingDueToday} due today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Completed */}
      <Card className="dashboard-card">
        <CardContent className="p-0">
          <div className="stats-card bg-green-50 dark:bg-green-900/20">
            <div className="stats-icon bg-green-100 dark:bg-green-800">
              <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">
                Completed This Week
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {mockStats.completedThisWeek}
              </div>
              <div className="flex items-center mt-1 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  <i className="fas fa-chart-line mr-1"></i>{" "}
                  {mockStats.completionRate}% completion rate
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Assessed */}
      <Card className="dashboard-card">
        <CardContent className="p-0">
          <div className="stats-card bg-purple-50 dark:bg-purple-900/20">
            <div className="stats-icon bg-purple-100 dark:bg-purple-800">
              <i className="fas fa-users text-purple-600 dark:text-purple-400"></i>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">
                Students Assessed
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {mockStats.studentsAssessed}
              </div>
              <div className="flex items-center mt-1 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  <i className="fas fa-graduation-cap mr-1"></i> Across{" "}
                  {mockStats.coursesCount} courses
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
