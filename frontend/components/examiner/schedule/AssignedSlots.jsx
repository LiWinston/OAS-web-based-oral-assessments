"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { examinerTimeslotService } from "../../../services/examinerTimeslotService";
import { useExaminerAuth } from "../../../hooks/useExaminerAuth";
import { useTimeslotAssignment } from "../../../hooks/useTimeslotAssignment";
import { Button } from "../../ui/button";
import OperationResultDialog from "@/components/examiner/schedule/OperationResultDialog";
import { formatVenue } from '@/utils/formatVenue';
import useScheduleFilterStore from "../../../store/scheduleFilterStore";

function formatTime(isoString, timezone = "Australia/Melbourne") {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-AU", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// centralized formatter used via import

export default function AssignedSlots({ showDebugSection = false }) {
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const { selectedCourse } = useScheduleFilterStore();
  const { withdrawFromTimeslot, isSubmitting, canWithdraw } =
    useTimeslotAssignment();

  // Fetch assigned timeslots from schedule
  const {
    data: scheduleData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["examinerSchedule", examinerId, selectedCourse],
    queryFn: () => examinerTimeslotService.getExaminerSchedule(examinerId),
    enabled: isValidExaminer,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });

  const [resultOpen, setResultOpen] = React.useState(false);
  const [resultProps, setResultProps] = React.useState({});

  const handleWithdraw = async (slot) => {
    try {
      const res = await withdrawFromTimeslot(slot, () => {
        refetch();
      });
      if (res?.success) {
        const start = slot.start ? new Date(slot.start) : null;
        const end = slot.end ? new Date(slot.end) : null;
        const detail = start && end
          ? `${start.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})} – ${end.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})}`
          : `Slot #${slot.slotId}`;
        setResultProps({
          status: 'success',
          title: 'Withdrawn from Time Slot',
          message: 'Your schedule has been updated.',
          details: [detail],
          autoDismiss: true,
          autoDismissMs: 1300,
        });
        setResultOpen(true);
      }
    } catch (error) {
      setResultProps({
        status: 'error',
        title: 'Withdraw Failed',
        message: error?.message || 'Unable to withdraw from this timeslot.',
        autoDismiss: false,
        primaryActionLabel: 'Close',
      });
      setResultOpen(true);
    }
  };

  // Get all assigned slots and filter by course if selected
  const allAssignedSlots = React.useMemo(() => {
    if (!scheduleData?.data?.assignments) return [];

    const slots = scheduleData.data.assignments
      .filter(
        (assignment) =>
          !selectedCourse || assignment.courseCode === selectedCourse
      )
      .flatMap((assignment) =>
        assignment.slots.map((slot) => ({
          ...slot,
          assignmentId: assignment.assignmentId,
          assignmentName: assignment.assignmentName,
          courseCode: assignment.courseCode,
          courseName: assignment.courseName,
        }))
      );

    // Sort by date and time
    return slots.sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [scheduleData, selectedCourse]);

  // Group slots into upcoming and past
  const now = new Date();
  const upcomingSlots = allAssignedSlots.filter(
    (slot) => new Date(slot.start) > now
  );
  const pastSlots = allAssignedSlots.filter(
    (slot) => new Date(slot.start) <= now
  );

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading assigned slots...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <div className="p-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Failed to load assigned slots.
            <button
              onClick={() => refetch()}
              className="underline hover:no-underline ml-1"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="p-6">
        <OperationResultDialog open={resultOpen} onOpenChange={setResultOpen} {...resultProps} />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
              <i className="fas fa-calendar-check text-blue-600 dark:text-blue-400 mr-2"></i>
              My Assigned Slots
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your assigned examination timeslots
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {selectedCourse && (
              <span className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                <i className="fas fa-filter mr-1"></i>
                {selectedCourse}
              </span>
            )}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <i className="fas fa-clock mr-1"></i>
              Auto-updates every 30s
            </div>
          </div>
        </div>

        {allAssignedSlots.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-calendar-times text-gray-400 dark:text-gray-500 text-3xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
              No Assigned Slots
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedCourse
                ? `No assigned slots found for ${selectedCourse}. Try clearing the filter or assign yourself to some timeslots.`
                : "You have no assigned timeslots yet. Visit the Assessments to Assign section above to get started."}
            </p>
            {selectedCourse && (
              <Button
                variant="outline"
                onClick={() => {
                  const store = useScheduleFilterStore.getState();
                  store.setSelectedCourse("");
                }}
                className="mr-2"
              >
                <i className="fas fa-times mr-2"></i>
                Clear Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Slots */}
            {upcomingSlots.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <i className="fas fa-arrow-right text-green-600 mr-2"></i>
                  Upcoming Slots ({upcomingSlots.length})
                </h3>
                <div className="space-y-3">
                  {upcomingSlots.map((slot) => (
                    <div
                      key={slot.slotId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {formatDate(slot.start)} •{" "}
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              <i className="fas fa-check mr-1"></i>Assigned
                            </span>
                          </div>

                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center mb-1">
                              <i className="fas fa-book text-blue-600 mr-2"></i>
                              <strong>{slot.courseCode}</strong> -{" "}
                              {slot.courseName}
                            </div>
                            <div className="flex items-center mb-1">
                              <i className="fas fa-tasks text-purple-600 mr-2"></i>
                              {slot.assignmentName}
                            </div>
                            <div className="flex items-center mb-1">
                              <i className="fas fa-map-marker-alt text-red-600 mr-2"></i>
                              {formatVenue(slot.venue)}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div
                              className={`flex items-center ${
                                slot.bookingCount > 0
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              <i
                                className={`fas ${
                                  slot.bookingCount > 0
                                    ? "fa-users"
                                    : "fa-user-slash"
                                } mr-1`}
                              ></i>
                              {slot.bookingCount} student
                              {slot.bookingCount !== 1 ? "s" : ""} booked
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {/* Start Assessment button for booked sessions */}
                          {slot.bookingCount > 0 && (
                            <Button
                              onClick={() => {
                                // Navigate to assessment page with sessionId
                                window.location.href = `/examiner/assessment/${slot.slotId}`;
                              }}
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <i className="fas fa-clipboard-check mr-2"></i>
                              Start Assessment
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleWithdraw(slot)}
                            disabled={!canWithdraw(slot) || isSubmitting}
                            variant={
                              canWithdraw(slot) ? "destructive" : "outline"
                            }
                            size="sm"
                            className={
                              !canWithdraw(slot)
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                            title={
                              !canWithdraw(slot)
                                ? "Cannot withdraw: Students are already booked for this session"
                                : "Click to withdraw from this timeslot"
                            }
                          >
                            {isSubmitting ? (
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                            ) : (
                              <i className="fas fa-times mr-2"></i>
                            )}
                            Withdraw
                          </Button>

                          {!canWithdraw(slot) && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 text-right">
                              <i className="fas fa-info-circle mr-1"></i>
                              Cannot withdraw
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Slots */}
            {pastSlots.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <i className="fas fa-history text-gray-600 mr-2"></i>
                  Past Slots ({pastSlots.length})
                </h3>
                <div className="space-y-3">
                  {pastSlots.slice(0, 5).map((slot) => (
                    <div
                      key={slot.slotId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 opacity-75"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-600 dark:text-gray-400">
                              {formatDate(slot.start)} •{" "}
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              <i className="fas fa-check-circle mr-1"></i>
                              Completed
                            </span>
                          </div>

                          <div className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                            <div className="flex items-center mb-1">
                              <i className="fas fa-book mr-2"></i>
                              <strong>{slot.courseCode}</strong> -{" "}
                              {slot.assignmentName}
                            </div>
                            {slot.participants &&
                              slot.participants.length > 0 && (
                                <div className="flex items-center">
                                  <i className="fas fa-users mr-2"></i>
                                  {slot.participants.join(", ")}
                                </div>
                              )}
                          </div>
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            onClick={() => {
                              // Navigate to assessment page to view/edit assessment
                              window.location.href = `/examiner/assessment/${slot.slotId}`;
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <i className="fas fa-eye mr-2"></i>
                            View Assessment
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {pastSlots.length > 5 && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                      ... and {pastSlots.length - 5} more past slots
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
