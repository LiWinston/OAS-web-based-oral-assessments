"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button";
import AssessmentsToAssign from "../../../components/examiner/schedule/AssessmentsToAssign";
import ExaminerCalendar from "../../../components/examiner/schedule/ExaminerCalendar";
import UpcomingAssessments from "../../../components/examiner/schedule/UpcomingAssessments";
import { examinerTimeslotService } from "../../../services/examinerTimeslotService";
import { useAuthStore } from "../../../store/authStore";

/**
 * ExaminerSchedule Component
 *
 * Complete schedule management page for examiners featuring:
 * - Assessments needing time slot assignment
 * - Monthly calendar view of scheduled sessions
 * - Upcoming assessments list with real-time status
 */
export default function ExaminerSchedule() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState("month");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${monthStart.toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
    })} - ${monthEnd.toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  });
  const [availableCourses, setAvailableCourses] = useState([]);


  // Debug: Create a mock user if no user is logged in (for development testing)
  const debugUser = user || {
    id: "debug-examiner-123",
    role: "EXAMINER",
    username: "debug_examiner",
    email: "debug@examiner.test",
  };


  // Fetch available assignments to extract course list
  const { data: assignmentsData } = useQuery({
    queryKey: ["availableAssignments", debugUser?.id],
    queryFn: () =>
      examinerTimeslotService.getAvailableAssignments(debugUser?.id, {
        pageSize: 100,
      }),
    enabled: !!debugUser?.id,
  });

  // Update available courses when assignments data changes
  useEffect(() => {
    if (assignmentsData?.data?.data) {
      const courses = [
        ...new Set(
          assignmentsData.data.data.map((assignment) => assignment.courseCode)
        ),
      ]
        .sort()
        .map((code) => {
          const assignment = assignmentsData.data.data.find(
            (a) => a.courseCode === code
          );
          return {
            code,
            name: assignment?.courseName || code,
          };
        });
      setAvailableCourses(courses);
    }
  }, [assignmentsData]);

  const handleExportSchedule = () => {
    // Mock export functionality - will be implemented with real API
    const exportData = {
      format: "ical",
      dateRange: dateRange,
      course: selectedCourse || "all",
    };

    // For now, show success message
    alert(
      "Schedule export functionality will be implemented with backend integration"
    );
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <button
                onClick={() => router.push("/examiner")}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">
                  OAS
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Examiner
                </span>
              </button>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Schedule
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Schedule Management Tools */}
      <div className="dashboard-card">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Assessment Schedule
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage and view your upcoming assessment sessions
            </p>
          </div>

          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <i className="fas fa-filter"></i>
                </span>
                <select
                  className="form-control pl-10 pr-10 py-2 appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    // Update date range display when filter changes
                    if (e.target.value) {
                      // You could implement course-specific date ranges here if needed
                    }
                  }}
                >
                  <option value="">All Courses</option>
                  {availableCourses.map((course) => (
                    <option key={course.code} value={course.code}>
                      {course.code} -{" "}
                      {course.name.length > 30
                        ? course.name.substring(0, 30) + "..."
                        : course.name}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <i className="fas fa-chevron-down"></i>
                </span>
              </div>
              {selectedCourse && (
                <div className="absolute top-full left-0 mt-1 text-xs text-blue-600 dark:text-blue-400">
                  Filtering by {selectedCourse}
                  <button
                    onClick={() => setSelectedCourse("")}
                    className="ml-2 text-red-600 dark:text-red-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <div className="flex items-center">
                <span className="absolute left-3 text-gray-400">
                  <i className="fas fa-calendar-alt"></i>
                </span>
                <input
                  type="text"
                  className="form-control pl-10 py-2"
                  placeholder="Date Range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                />
              </div>
            </div>

            {/* Export Button */}
            <Button
              variant="outline"
              onClick={handleExportSchedule}
              className="flex items-center"
            >
              <i className="fas fa-download mr-1.5"></i>
              Export
            </Button>

            {/* Print Button */}
            <Button
              variant="outline"
              onClick={handlePrintSchedule}
              className="flex items-center"
            >
              <i className="fas fa-print mr-1.5"></i>
              Print
            </Button>
          </div>
        </div>

        {/* Calendar Navigation and View Toggles */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          {/* Month Navigation */}
          <div className="flex items-center mb-3 sm:mb-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              onClick={() => {
                const now = new Date();
                const monthStart = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  1
                );
                const monthEnd = new Date(
                  now.getFullYear(),
                  now.getMonth() + 1,
                  0
                );
                setDateRange(
                  `${monthStart.toLocaleDateString("en-AU", {
                    month: "short",
                    day: "numeric",
                  })} - ${monthEnd.toLocaleDateString("en-AU", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`
                );
              }}
              className="ml-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-200 transition-colors"
            >
              <i className="fas fa-calendar-day mr-1"></i>
              Today
            </button>
            {selectedCourse && (
              <div className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {selectedCourse} only
              </div>
            )}
          </div>

          {/* View Toggles */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setViewMode("month")}
            >
              <i className="fas fa-calendar-alt mr-1"></i>
              Month
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setViewMode("week")}
            >
              <i className="fas fa-calendar-week mr-1"></i>
              Week
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setViewMode("list")}
            >
              <i className="fas fa-list mr-1"></i>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Assessments to Assign Time Slot - Key feature from prototype */}
      <AssessmentsToAssign selectedCourse={selectedCourse} />

      {/* Main Content Area */}
      {viewMode === "month" ? (
        <>
          {/* Month View Calendar */}
          <ExaminerCalendar />

          {/* Upcoming Assessments List */}
          <UpcomingAssessments />
        </>
      ) : viewMode === "week" ? (
        <div className="dashboard-card p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-week text-blue-600 dark:text-blue-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Week View Coming Soon
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Week view will be available in the next update. Use Month view for
            now.
          </p>
        </div>
      ) : (
        <>
          {/* List View - Show upcoming assessments only */}
          <UpcomingAssessments />
        </>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Schedule updates automatically every 30 seconds
          </div>
          <div className="flex items-center">
            <i className="fas fa-mouse-pointer mr-2"></i>
            Click on calendar events for details
          </div>
          {selectedCourse && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <i className="fas fa-filter mr-2"></i>
              Showing {selectedCourse} assignments only
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
