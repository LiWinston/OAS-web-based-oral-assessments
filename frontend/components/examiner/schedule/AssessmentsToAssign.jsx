"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { examinerTimeslotService } from "@/services/examinerTimeslotService";
import { useExaminerAuth } from "@/hooks/useExaminerAuth";
import useScheduleFilterStore from "@/store/scheduleFilterStore";

const AssessmentsToAssign = () => {
  const router = useRouter();
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const { selectedCourse, assessmentType } = useScheduleFilterStore();

  const {
    data: assignmentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["availableAssignments", examinerId, selectedCourse],
    queryFn: () =>
      examinerTimeslotService.getAvailableAssignments(examinerId, {
        courseId: selectedCourse || undefined,
        pageSize: 50, // Get more assignments for better filtering
      }),
    refetchInterval: 2 * 60 * 1000, // Reduced to 2 minutes from 30 seconds
    staleTime: 60 * 1000, // 1 minute stale time
    enabled: isValidExaminer,
  });

  const assignments = assignmentsData?.data?.data || [];
  const renderAssignments = React.useMemo(() => {
    let list = assignments;
    if (selectedCourse) {
      list = list.filter(
        (a) => (a.courseCode || a.subjectCode) === selectedCourse
      );
    }
    if (assessmentType && assessmentType !== "ALL") {
      list = list.filter((assignment) => {
        const type = (assignment.assessmentType || assignment.type || "")
          .toString()
          .toUpperCase();
        return type === assessmentType;
      });
    }
    return list;
  }, [assignments, selectedCourse, assessmentType]);

  // Derive a simple lifecycle state for UX from dates
  const getAssignmentState = (assignment) => {
    const now = new Date();
    const startRaw = assignment.earliestTimeslot || assignment.startDate;
    const endRaw = assignment.latestTimeslot || assignment.endDate;
    const start = startRaw ? new Date(startRaw) : null;
    const end = endRaw ? new Date(endRaw) : null;
    if (end && !isNaN(end) && end < now) return "closed";
    if (start && !isNaN(start) && start > now) return "upcoming";
    return "open";
  };

  // No per-assignment availability probing here (single fetch UX)

  const handleSelectTimeSlots = (assignmentId) => {
    router.push(`/examiner/schedule/select?assignmentId=${assignmentId}`);
  };

  // No urgency styling for single-fetch basic info view

  const getStatusBadge = (assignment) => {
    const state = getAssignmentState(assignment);
    if (state === "open") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
          Open
        </span>
      );
    }
    if (state === "upcoming") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          Upcoming
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
        Closed
      </span>
    );
  };

  // No deadline/urgency chips in this view

  if (isLoading) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
            Assignments to Assign Timeslots
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Loading assignments...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
            Assigments to Assign Sessions
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load assignments
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (renderAssignments.length === 0) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
            Assignments to Assign Timeslots
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-check text-gray-400 dark:text-gray-500 text-2xl"></i>
          </div>
          {selectedCourse ? (
            <>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                No assignments for this course
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                The selected filter "{selectedCourse}" returned no results. Try
                clearing the filter or choosing a different course.
              </p>
              <button
                onClick={() => {
                  const store = useScheduleFilterStore.getState();
                  store.setSelectedCourse("");
                }}
                className="inline-flex items-center px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <i className="fas fa-times mr-1.5"></i>
                Clear Filter
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                All Caught Up!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                No assessments currently need examiner assignment. New
                assignments will appear here when they become available.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
            Assignments to Assign Timeslots
          </h2>
          <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {renderAssignments.length} available
          </span>
        </div>

        {/* Refresh indicator */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <i
            className="fas fa-sync-alt mr-1 animate-spin opacity-0"
            id="refresh-indicator"
          ></i>
          <span>Auto-refresh: 30s</span>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {renderAssignments.map((assignment) => (
          <div
            key={assignment.assignmentId}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate mr-3">
                    {assignment.assignmentName}
                  </div>
                  {getStatusBadge(assignment)}

                  {/* No urgency indicator in basic info view */}

                  {/* No deadline urgency hint in basic info view */}
                </div>

                <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
                  <span className="flex items-center">
                    <i className="fas fa-graduation-cap mr-1.5"></i>
                    {assignment.courseCode || assignment.subjectCode}
                    {(assignment.courseName || assignment.subjectName) && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        {assignment.courseName || assignment.subjectName}
                      </span>
                    )}
                  </span>

                  <span className="flex items-center">
                    <i
                      className={`fas ${
                        (assignment.assessmentType || assignment.type || "")
                          .toString()
                          .toLowerCase() === "group"
                          ? "fa-users"
                          : "fa-user"
                      } mr-1.5`}
                    ></i>
                    {(assignment.assessmentType || assignment.type || "")
                      .toString()
                      .toUpperCase() || "ASSESSMENT"}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-calendar-alt mr-1.5"></i>
                    {(() => {
                      const start =
                        assignment.earliestSession ||
                        assignment.earliestTimeslot ||
                        assignment.startDate;
                      const end =
                        assignment.latestSession ||
                        assignment.latestTimeslot ||
                        assignment.endDate;
                      const fmt = (d) =>
                        d
                          ? new Date(d).toLocaleDateString("en-AU", {
                              month: "short",
                              day: "numeric",
                            })
                          : "TBA";
                      return `${fmt(start)} - ${fmt(end)}`;
                    })()}
                  </span>
                  {assignment.status && (
                    <span className="flex items-center">
                      <i className="fas fa-info-circle mr-1.5"></i>
                      Status:{" "}
                      {(assignment.status || "").toString().toUpperCase()}
                    </span>
                  )}
                </div>

                {/* No capacity/available slots UI here; next step will check availability */}
              </div>

              {/* Action button (single-fetch list; availability checked in next step) */}
              <div className="ml-4 flex-shrink-0">
                {(() => {
                  const state = getAssignmentState(assignment);
                  if (state === "closed") {
                    return (
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm flex items-center">
                        <i className="fas fa-ban mr-1.5"></i>
                        Closed
                      </div>
                    );
                  }
                  return (
                    <button
                      onClick={() =>
                        handleSelectTimeSlots(assignment.assignmentId)
                      }
                      className="px-3 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm bg-blue-600 hover:bg-blue-700"
                    >
                      <i className="fas fa-plus mr-1.5"></i>
                      Select Sessions
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with summary */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            Showing {assignments.length} assignment
            {assignments.length !== 1 ? "s" : ""}
            {selectedCourse && ` for ${selectedCourse}`}• Updates automatically
            every 30 seconds
          </span>
          <div className="flex items-center">
            <i className="fas fa-info-circle mr-1"></i>
            Click "Select Sessions" to choose your examination times
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsToAssign;
