"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { studentBookingServiceReal as studentBookingService } from "@/services/studentBookingReal";
import useScheduleFilterStore from "@/store/scheduleFilterStore";

export default function AssignmentsAvailable() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const studentId = user?.id || user?.userId || user?.studentId;
  const { selectedCourse, assessmentType, searchText } = useScheduleFilterStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["studentAssignments", studentId, selectedCourse, assessmentType, searchText],
    queryFn: () => studentBookingService.getStudentAssignments(studentId, { status: "bookable", pageSize: 100 }),
    enabled: isAuthenticated && Boolean(studentId),
    staleTime: 5 * 60 * 1000,
  });

  const assignmentsRaw = data?.data?.data || [];
  // Apply client-side filters and guard against backend delay in reflecting status
  const assignments = assignmentsRaw.filter((a) => {
    // Exclude anything already booked just in case backend status cache is stale
    if (a?.booking?.hasActiveBooking) return false;
    // Only show released assignments with remaining availability
    if (!a?.availability?.released) return false;
    if (typeof a?.availability?.availableSessions === 'number' && a.availability.availableSessions <= 0) return false;
    if (selectedCourse && a.courseCode !== selectedCourse) return false;
    if (assessmentType && assessmentType !== "ALL" && a.assessmentType !== assessmentType) return false;
    if (searchText && searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      return (
        a.assignmentName.toLowerCase().includes(q) ||
        a.courseCode.toLowerCase().includes(q) ||
        (a.courseName || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const onBook = (assignmentId) => router.push(`/student/booking/${assignmentId}`);

  const formatDeadline = (deadline) => {
    if (!deadline) return "";
    const date = new Date(deadline);
    return date.toLocaleString("en-AU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const PolicyChips = ({ availability }) => {
    if (!availability) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {availability.reschedulingEnabled !== undefined && (
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {availability.reschedulingEnabled ? 'Reschedule allowed' : 'Reschedule disabled'}
          </span>
        )}
        {availability.lockoutEnabled && typeof availability.lockoutWindowHours === 'number' && (
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            Lockout {availability.lockoutWindowHours}h
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-plus text-blue-600 dark:text-blue-400 mr-2"></i>
            Assignments Available to Book
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-plus text-blue-600 dark:text-blue-400 mr-2"></i>
            Assignments Available to Book
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load assignments</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!assignments.length) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-plus text-blue-600 dark:text-blue-400 mr-2"></i>
            Assignments Available to Book
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-check text-gray-400 dark:text-gray-500 text-2xl"></i>
          </div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">No available assignments right now</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">New bookable assignments will appear here once released by course admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-plus text-blue-600 dark:text-blue-400 mr-2"></i>
            Assignments Available to Book
          </h2>
          <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {assignments.length} available
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {assignments.map((a) => (
          <div key={a.assignmentId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate mr-3">{a.assignmentName}</div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {a.assessmentType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
                  <span className="flex items-center">
                    <i className="fas fa-graduation-cap mr-1.5"></i>
                    {a.courseCode}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-clock mr-1.5"></i>
                    {a.availability.availableSessions} sessions available
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-calendar-day mr-1.5"></i>
                    Earliest: {new Date(a.availability.earliestSession).toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                  </span>
                  {a.availability.bookingDeadline && (
                    <span className="flex items-center">
                      <i className="fas fa-hourglass-half mr-1.5"></i>
                      Deadline: {formatDeadline(a.availability.bookingDeadline)}
                    </span>
                  )}
                </div>
                <PolicyChips availability={a.availability} />
              </div>
              <div className="ml-4">
                <button
                  onClick={() => onBook(a.assignmentId)}
                  className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <i className="fas fa-calendar-check mr-1"></i>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
