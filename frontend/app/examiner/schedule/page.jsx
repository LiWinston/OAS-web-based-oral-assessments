"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/button";
import AssessmentsToAssign from "../../../components/examiner/schedule/AssessmentsToAssign";
import AssignedSlots from "../../../components/examiner/schedule/AssignedSlots";
import ExaminerCalendar from "../../../components/examiner/schedule/ExaminerCalendar";
import { examinerTimeslotService } from "../../../services/examinerTimeslotService";
import { useExaminerAuth } from "../../../hooks/useExaminerAuth";
import WeekSchedule from "../../../components/examiner/schedule/WeekSchedule";
import DaySchedule from "../../../components/examiner/schedule/DaySchedule";
import ScheduleFilters from "../../../components/examiner/schedule/ScheduleFilters";
import useScheduleFilterStore from "../../../store/scheduleFilterStore";
import { useNotification } from "../../../hooks/useNotification";

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
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const [viewMode, setViewMode] = useState("month");
  const { selectedCourse, searchText } = useScheduleFilterStore();
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
  const { showNotification } = useNotification();


  // Fetch available assignments to extract course list
  const { data: assignmentsData } = useQuery({
    queryKey: ["availableAssignments", examinerId],
    queryFn: () =>
      examinerTimeslotService.getAvailableAssignments(examinerId, {
        pageSize: 100,
      }),
    enabled: isValidExaminer,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  const handleExportSchedule = async () => {
    try {
      // Export current month range
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      if (!isValidExaminer) {
        showNotification('error', 'Please log in to export schedule');
        return;
      }
      
      const res = await examinerTimeslotService.getExaminerSchedule(examinerId, { dateFrom: from, dateTo: to });
      const assignments = res?.data?.assignments || [];
      const events = assignments.flatMap(a => a.slots.map(s => ({
        assignmentId: a.assignmentId,
        assignmentName: a.assignmentName,
        courseCode: a.courseCode,
        courseName: a.courseName,
        start: s.start,
        end: s.end,
        venue: s.venue,
        participants: s.participants || []
      })));
      // Apply filters
      const filtered = events.filter(e => {
        if (selectedCourse && e.courseCode !== selectedCourse) return false;
        // assessmentType not available in export mock events, skip type filtering here
        if (searchText && searchText.trim()) {
          const q = searchText.trim().toLowerCase();
          const hit = e.assignmentName.toLowerCase().includes(q) || e.courseName.toLowerCase().includes(q) || e.courseCode.toLowerCase().includes(q) || (e.participants && e.participants.some(p => p.toLowerCase().includes(q)));
          if (!hit) return false;
        }
        return true;
      });
      const pad = (n) => String(n).padStart(2, '0');
      const toICSDate = (d) => {
        const dt = new Date(d);
        return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth()+1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
      };
      const escapeICS = (s) => (s || '').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//OAS//Examiner Schedule//EN'
      ];
      filtered.forEach(e => {
        const uid = `${e.assignmentId}-${e.start}-${e.end}@oas`;
        const dtStart = toICSDate(e.start);
        const dtEnd = toICSDate(e.end);
        const summary = `${e.courseCode} ${e.assignmentName}`;
        const location = e.venue ? `${e.venue.name} ${e.venue.building} ${e.venue.room}` : '';
        const desc = e.participants && e.participants.length ? `Participants: ${e.participants.join(', ')}` : '';
        icsLines.push('BEGIN:VEVENT');
        icsLines.push(`UID:${uid}`);
        icsLines.push(`DTSTAMP:${toICSDate(new Date())}`);
        icsLines.push(`DTSTART:${dtStart}`);
        icsLines.push(`DTEND:${dtEnd}`);
        icsLines.push(`SUMMARY:${escapeICS(summary)}`);
        if (location) icsLines.push(`LOCATION:${escapeICS(location)}`);
        if (desc) icsLines.push(`DESCRIPTION:${escapeICS(desc)}`);
        icsLines.push('END:VEVENT');
      });
      icsLines.push('END:VCALENDAR');
      const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'examiner-schedule.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Exported schedule as .ics file');
    } catch (e) {
      showNotification('error', 'Failed to export schedule');
    }
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

          <ScheduleFilters courseOptions={availableCourses} />

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
                viewMode === "day"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setViewMode("day")}
            >
              <i className="fas fa-calendar-day mr-1"></i>
              Day
            </button>
          </div>
        </div>
      </div>

      {viewMode === "month" ? (
        <>
          <AssessmentsToAssign />
          <AssignedSlots showDebugSection={process.env.NODE_ENV === 'development'} />
          <ExaminerCalendar />
        </>
      ) : viewMode === "week" ? (
        <WeekSchedule />
      ) : (
        <DaySchedule />
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
          <div className="flex items-center">
            <i className="fas fa-times-circle mr-2"></i>
            Use "My Assigned Slots" to withdraw from unbooked sessions
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
