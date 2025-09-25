"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button";
import { examinerTimeslotService } from "../../../../services/examinerTimeslotService";
import { useExaminerAuth } from "../../../../hooks/useExaminerAuth";
import TimeslotSelectionCalendar from "../../../../components/examiner/schedule/TimeslotSelectionCalendar";
import TimeslotList from "../../../../components/examiner/schedule/TimeslotList";
import SelectionSummary from "../../../../components/examiner/schedule/SelectionSummary";
import OperationResultDialog from "@/components/examiner/schedule/OperationResultDialog";
import { toLocalDateKey } from "@/utils/dateUtils";

/**
 * SessionSelection Component (name retained for compatibility)
 *
 * The workflow now assumes the assignment has already been chosen on the
 * schedule overview page and is passed via the query string.
 */
function TimeslotSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { examinerId, isValidExaminer } = useExaminerAuth();

  const assignmentIdParam = searchParams.get("assignmentId");
  const parsedAssignmentId = assignmentIdParam
    ? Number.parseInt(assignmentIdParam, 10)
    : null;
  const hasValidAssignmentId =
    Number.isInteger(parsedAssignmentId) && parsedAssignmentId > 0;
  const assignmentId = hasValidAssignmentId ? parsedAssignmentId : null;

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentNotFound, setAssignmentNotFound] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allocatedSlots, setAllocatedSlots] = useState([]);
  const [currentAllocation, setCurrentAllocation] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [selectionMessage, setSelectionMessage] = useState(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultDialogProps, setResultDialogProps] = useState({});
  const queryClient = useQueryClient();

  // Debug logging for development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Debug - Examiner Auth:", {
        examinerId,
        isValidExaminer,
      });
    }
  }, [examinerId, isValidExaminer]);

  // Fetch available assignments with debugging
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["availableAssignments", examinerId],
    queryFn: async () => {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "🌐 API Call - Getting available assignments for examiner:",
          examinerId
        );
      }
      try {
        const result = await examinerTimeslotService.getAvailableAssignments(
          examinerId
        );
        if (process.env.NODE_ENV === "development") {
          console.log("📦 API Response - Available assignments:", result);
        }
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ API Error - Failed to fetch assignments:", error);
        }
        throw error;
      }
    },
    enabled: isValidExaminer && !!examinerId && hasValidAssignmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Debug assignments data changes
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && assignmentsData) {
      console.log("📊 Debug - Assignments data updated:", {
        success: assignmentsData?.success,
        dataLength: assignmentsData?.data?.data?.length || 0,
        totalAssignments: assignmentsData?.data?.total || 0,
        errorPresent: !!assignmentsError,
      });
    }
  }, [assignmentsData, assignmentsError]);

  // Reset local selection state when the requested assignment changes
  useEffect(() => {
    setSelectedAssignment(null);
    setAssignmentNotFound(false);
    setSelectedDate(null);
    setAllocatedSlots([]);
    setCurrentAllocation(0);
    setSelectionMessage(null);
    setSubmitError(null);
    setSubmitResult(null);
    setIsSubmitting(false);
    setResultDialogOpen(false);
    setResultDialogProps({});
  }, [assignmentId]);

  // Once assignments are loaded, capture the selected assignment details
  useEffect(() => {
    if (!assignmentId || !assignmentsData?.success) return;

    const list = assignmentsData?.data?.data || [];
    const match = list.find((a) => a.assignmentId === assignmentId);

    if (match) {
      setSelectedAssignment(match);
      setAssignmentNotFound(false);
    } else {
      setSelectedAssignment(null);
      setAssignmentNotFound(true);
    }
  }, [assignmentId, assignmentsData]);

  // Fetch available sessions when assignment is selected and on step 2
  const {
    data: timeslotsData,
    isLoading: isLoadingTimeslots,
    error: timeslotsError,
    refetch: refetchTimeslots,
  } = useQuery({
    queryKey: [
      "availableSessions",
      selectedAssignment?.assignmentId,
      examinerId,
    ],
    queryFn: async () => {
      if (process.env.NODE_ENV === "development") {
        console.log("🌐 API Call - Getting available sessions:", {
          assignmentId: selectedAssignment.assignmentId,
          examinerId: examinerId,
        });
      }
      try {
        const result = await examinerTimeslotService.getAvailableSessions(
          selectedAssignment.assignmentId,
          { examinerId }
        );
        if (process.env.NODE_ENV === "development") {
          console.log("📦 API Response - Available sessions:", result);
        }
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ API Error - Failed to fetch sessions:", error);
        }
        throw error;
      }
    },
    enabled: !!selectedAssignment && isValidExaminer && !!examinerId,
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Availability summary used by the session availability banner
  const availabilitySummary = useMemo(() => {
    if (!timeslotsData?.success) return null;
    const sessions =
      timeslotsData.data?.sessions || timeslotsData.data?.timeSlots;
    if (!Array.isArray(sessions)) return null;
    const selectable = sessions.filter((s) => s?.availability?.canSelect);
    const reasonsMap = sessions
      .filter((s) => !s?.availability?.canSelect && s?.availability?.reason)
      .reduce((acc, s) => {
        const r = s.availability.reason;
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
    let primaryReason = null;
    if (selectable.length === 0) {
      const arr = Object.entries(reasonsMap).sort((a, b) => b[1] - a[1]);
      if (arr.length > 0) primaryReason = arr[0][0];
    }
    return {
      hasAny: sessions.length > 0,
      hasSelectable: selectable.length > 0,
      primaryReason,
      reasonsMap,
    };
  }, [timeslotsData]);

  const assignmentLoading = hasValidAssignmentId && isLoadingAssignments;
  const showAssignmentError = hasValidAssignmentId && !!assignmentsError;
  const showAssignmentNotFound =
    hasValidAssignmentId &&
    !assignmentLoading &&
    !assignmentsError &&
    assignmentNotFound;

  // Prefer assignment and examiner info from sessions API payload when available
  const maxSessions = useMemo(
    () =>
      timeslotsData?.data?.examinerInfo?.maxSessions ??
      selectedAssignment?.examinerInfo?.maxSessions ??
      12,
    [timeslotsData, selectedAssignment]
  );
  const summaryAssignment = useMemo(
    () => ({
      ...(timeslotsData?.data?.assignment || {}),
      ...(selectedAssignment || {}),
    }),
    [timeslotsData, selectedAssignment]
  );

  const assignmentWindow = useMemo(() => {
    if (!summaryAssignment) {
      return { start: null, end: null };
    }
    const start =
      summaryAssignment.startDate ||
      summaryAssignment.earliestTimeslot ||
      summaryAssignment.earliestSession ||
      null;
    const end =
      summaryAssignment.endDate ||
      summaryAssignment.latestTimeslot ||
      summaryAssignment.latestSession ||
      null;
    return { start, end };
  }, [summaryAssignment]);

  const formatDateRange = (startIso, endIso) => {
    if (!startIso && !endIso) return null;

    const formatDate = (value, withTime = false) =>
      value
        ? new Date(value).toLocaleDateString("en-AU", {
            month: "short",
            day: "numeric",
            year: "numeric",
            ...(withTime
              ? {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              : {}),
          })
        : null;

    const formatTime = (value) =>
      value
        ? new Date(value).toLocaleTimeString("en-AU", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : null;

    const startDate = startIso ? new Date(startIso) : null;
    const endDate = endIso ? new Date(endIso) : null;

    if (startDate && endDate && startDate.toDateString() === endDate.toDateString()) {
      return `${formatDate(startDate, false)} · ${formatTime(startDate)} – ${formatTime(endDate)}`;
    }

    const startPart = startDate ? formatDate(startDate, true) : null;
    const endPart = endDate ? formatDate(endDate, true) : null;

    if (startPart && endPart) return `${startPart} – ${endPart}`;
    return startPart || endPart;
  };

  const formatAssessmentType = (assignment) => {
    const rawType =
      assignment?.assessmentType || assignment?.assessmentTypeRaw || assignment?.type;
    return rawType ? rawType.toString().toUpperCase() : "UNKNOWN";
  };

  const formatStatusLabel = (assignment) => {
    if (!assignment) return null;
    if (assignment.statusLabel) return assignment.statusLabel;
    if (assignment.status) {
      return assignment.status
        .toString()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }
    return null;
  };

  const summaryChips = useMemo(() => {
    if (!summaryAssignment) return [];

    const chips = [];

    const subjectParts = [
      summaryAssignment.courseCode || summaryAssignment.subjectCode,
      summaryAssignment.courseName || summaryAssignment.subjectName,
    ].filter(Boolean);
    if (subjectParts.length > 0) {
      chips.push({
        key: "subject",
        icon: "fa-graduation-cap",
        text: subjectParts.join(" · "),
      });
    }

    if (summaryAssignment.assignmentName) {
      chips.push({
        key: "assignmentName",
        icon: "fa-clipboard-check",
        text: summaryAssignment.assignmentName,
      });
    }

    const assessmentType = formatAssessmentType(summaryAssignment);
    if (assessmentType) {
      chips.push({
        key: "assessmentType",
        icon:
          assessmentType.toLowerCase() === "group" ? "fa-users" : "fa-user",
        text: `${assessmentType} Assessment`,
      });
    }

    const windowLabel = formatDateRange(assignmentWindow.start, assignmentWindow.end);
    if (windowLabel) {
      chips.push({
        key: "window",
        icon: "fa-calendar-alt",
        text: windowLabel,
      });
    }

    if (typeof summaryAssignment.weight === "number") {
      chips.push({
        key: "weight",
        icon: "fa-scale-balanced",
        text: `Weight: ${summaryAssignment.weight}%`,
      });
    }

    const formattedStatus = formatStatusLabel(summaryAssignment);
    if (formattedStatus) {
      chips.push({
        key: "status",
        icon: "fa-info-circle",
        text: `Status: ${formattedStatus}`,
      });
    }

    const backendAssigned = selectedAssignment?.examinerInfo?.currentAssignedSessions;
    if (Number.isFinite(backendAssigned) && backendAssigned >= 0) {
      chips.push({
        key: "assigned",
        icon: "fa-briefcase",
        text: `Already Assigned: ${backendAssigned}`,
      });
    }

    const backendRemaining = selectedAssignment?.examinerInfo?.remainingCapacity;
    if (Number.isFinite(backendRemaining) && backendRemaining >= 0) {
      chips.push({
        key: "remaining",
        icon: "fa-hourglass-half",
        text: `Remaining Capacity: ${backendRemaining}`,
      });
    }

    const finiteMaxSessions = Number.isFinite(maxSessions) ? maxSessions : null;
    const selectionText =
      finiteMaxSessions != null
        ? `Selected: ${currentAllocation}/${finiteMaxSessions}`
        : `Selected: ${currentAllocation}`;
    chips.push({
      key: "selection",
      icon: "fa-list-check",
      text: selectionText,
    });

    return chips;
  }, [
    summaryAssignment,
    assignmentWindow,
    currentAllocation,
    maxSessions,
    selectedAssignment,
  ]);

  // Get available dates from API data
  const getAvailableDates = () => {
    if (!timeslotsData?.success) {
      return [];
    }
    const sessions =
      timeslotsData.data?.sessions || timeslotsData.data?.timeSlots;
    if (!Array.isArray(sessions)) return [];

    const dates = new Set();
    sessions.forEach((slot) => {
      dates.add(toLocalDateKey(new Date(slot.start)));
    });

    return Array.from(dates);
  };

  const dateHasSlots = (date) => {
    return getAvailableDates().includes(date);
  };

  const hasConflict = (a, b) => {
    const aStart = new Date(a.start).getTime();
    const aEnd = new Date(a.end).getTime();
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return aStart < bEnd && bStart < aEnd;
  };

  const selectSlot = (slot) => {
    setSelectionMessage(null);
    const slotIndex = allocatedSlots.findIndex((s) => s.slotId === slot.slotId);
    if (slotIndex >= 0) {
      const removedSessions = allocatedSlots[slotIndex].sessionCount;
      const newSlots = allocatedSlots.filter((s) => s.slotId !== slot.slotId);
      setAllocatedSlots(newSlots);
      setCurrentAllocation(currentAllocation - removedSessions);
    } else {
      const cap = maxSessions;
      if (currentAllocation + slot.sessionCount > cap) {
        setSelectionMessage({
          type: "error",
          text: `You have reached your maximum allocation of ${maxSessions} sessions.`,
        });
        return;
      }
      const conflict = allocatedSlots.find((s) => hasConflict(s, slot));
      if (conflict) {
        setSelectionMessage({
          type: "error",
          text: "This session conflicts with another selected session. Please choose a different time.",
        });
        return;
      }
      setAllocatedSlots([...allocatedSlots, slot]);
      setCurrentAllocation(currentAllocation + slot.sessionCount);
    }
  };

  const isSlotSelected = (slotId) => {
    return allocatedSlots.some((slot) => slot.slotId === slotId);
  };

  const removeSlot = (slotId) => {
    const slotIndex = allocatedSlots.findIndex((s) => s.slotId === slotId);
    if (slotIndex >= 0) {
      const removedSessions = allocatedSlots[slotIndex].sessionCount;
      const newSlots = allocatedSlots.filter((s) => s.slotId !== slotId);
      setAllocatedSlots(newSlots);
      setCurrentAllocation(currentAllocation - removedSessions);
    }
  };

  const canSubmit = () => {
    // No minimum requirement as per MVP notes, just need at least one slot
    return allocatedSlots.length > 0;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !selectedAssignment) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);

    try {
      const slotAssignments = allocatedSlots.map((slot) => ({
        slotId: slot.slotId,
      }));

      const result = await examinerTimeslotService.assignExaminerToTimeslots(
        selectedAssignment.assignmentId,
        {
          examinerId,
          slotAssignments,
        }
      );

      setSubmitResult(result);

      if (result.success) {
        // Invalidate schedule queries so main page reflects latest data
        queryClient.invalidateQueries({ queryKey: ["examinerSchedule"] });
        queryClient.invalidateQueries({ queryKey: ["examinerDay"] });
        queryClient.invalidateQueries({ queryKey: ["examinerWeek"] });
        queryClient.invalidateQueries({ queryKey: ["availableAssignments"] });
        queryClient.invalidateQueries({
          queryKey: ["availableSessions", selectedAssignment?.assignmentId],
        });

        // Show modal dialog in the center with summary
        const details = (result.data?.assignedSlots || [])
          .slice(0, 5)
          .map((s) => {
            const match =
              allocatedSlots.find((x) => x.slotId === s.slotId) || {};
            const start = match.start ? new Date(match.start) : null;
            const end = match.end ? new Date(match.end) : null;
            if (start && end) {
              return `${start.toLocaleDateString("en-AU", {
                month: "short",
                day: "numeric",
              })} ${start.toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
              })} – ${end.toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
              })}`;
            }
            return `Slot #${s.slotId}`;
          });
        setResultDialogProps({
          status: result.data?.partial ? "warning" : "success",
          title: result.data?.partial
            ? "Partial Assignment Completed"
            : "Sessions Assigned",
          message: result.data?.partial
            ? `Assigned ${result.data.assignedSlots.length} session(s), ${result.data.failedSlots.length} failed.`
            : `Successfully assigned ${result.data.assignedSlots.length} session(s).`,
          details,
          autoDismiss: true,
          autoDismissMs: 5000,
          onAutoDismiss: () => router.push("/examiner/schedule"),
          onPrimaryAction: () => router.push("/examiner/schedule"),
          primaryActionLabel: "View My Schedule",
        });
        setResultDialogOpen(true);
      } else {
        const msg = result.message || "Failed to submit selections";
        setSubmitError(msg);
        setResultDialogProps({
          status: "error",
          title: "Assignment Failed",
          message: msg,
          autoDismiss: false,
          primaryActionLabel: "Close",
        });
        setResultDialogOpen(true);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("Failed to submit selections. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    setSelectedDate(null); // Clear selected date when changing months
  };

  // Calendar layout and formatting handled by child components

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
              <button
                onClick={() => router.push("/examiner/schedule")}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Schedule
              </button>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Session Selection
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Session Selection
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Browse and select sessions for upcoming assessments within your
          allocation limits.
        </p>
      </div>

      {!hasValidAssignmentId && (
        <div className="dashboard-card p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Assignment required
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select an assignment from your schedule before choosing
                sessions.
              </p>
            </div>
            <Button onClick={() => router.push("/examiner/schedule")}>Back to Schedule</Button>
          </div>
        </div>
      )}

      {hasValidAssignmentId && assignmentLoading && (
        <div className="dashboard-card p-5 mb-6">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading assignment details...</span>
          </div>
        </div>
      )}

      {showAssignmentError && (
        <div className="dashboard-card p-5 mb-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-200">
            <div className="flex items-start gap-3">
              <i className="fas fa-exclamation-triangle mt-0.5"></i>
              <div>
                <p className="font-medium">Failed to load assignment</p>
                <p className="mt-1">
                  Please refresh or return to the schedule to pick another
                  assignment.
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => refetchAssignments()}>
                    Retry
                  </Button>
                  <Button size="sm" onClick={() => router.push("/examiner/schedule")}>
                    Back to Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignmentNotFound && (
        <div className="dashboard-card p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Assignment unavailable
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This assignment is no longer available for self-assignment.
              </p>
            </div>
            <Button onClick={() => router.push("/examiner/schedule")}>Back to Schedule</Button>
          </div>
        </div>
      )}

      {/* Session Selection */}
      {selectedAssignment && (
        <div className="space-y-6">
          {/* Assignment Summary */}
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                <i className="fas fa-clipboard-list text-blue-600 dark:text-blue-400 mr-2"></i>
                Assignment Summary
              </h2>
            </div>

            {summaryAssignment && (
              <>
                {summaryAssignment.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {summaryAssignment.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {summaryChips.map((chip) => (
                    <div
                      key={chip.key}
                      className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg"
                    >
                      <i className={`fas ${chip.icon} text-gray-400 mr-2`}></i>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {chip.text}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Availability Banner */}
          {!isLoadingTimeslots &&
            availabilitySummary &&
            !availabilitySummary.hasSelectable && (
              <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                <div className="flex items-start">
                  <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 mr-3 mt-0.5"></i>
                  <div>
                    <div className="font-medium text-amber-800 dark:text-amber-200">
                      {availabilitySummary.primaryReason === "SLOT_FULL" &&
                        "Fully Staffed"}
                      {availabilitySummary.primaryReason === "TIME_CONFLICT" &&
                        "All Slots Conflict With Your Schedule"}
                      {availabilitySummary.primaryReason ===
                        "ALREADY_ASSIGNED" &&
                        "You Are Already Assigned To These Slots"}
                      {!availabilitySummary.primaryReason &&
                        (availabilitySummary.hasAny
                          ? "No Selectable Slots Available"
                          : "No Slots Configured Yet")}
                    </div>
                    <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {availabilitySummary.primaryReason === "SLOT_FULL" &&
                        "Please wait for the course admin to add more slots or for capacity to become available."}
                      {availabilitySummary.primaryReason === "TIME_CONFLICT" &&
                        "Try a different time range, or withdraw from conflicting slots in your schedule."}
                      {availabilitySummary.primaryReason ===
                        "ALREADY_ASSIGNED" &&
                        "You are already assigned across the current sessions."}
                      {!availabilitySummary.primaryReason &&
                        (availabilitySummary.hasAny
                          ? "All current slots are unavailable for selection."
                          : "Course admin has not configured any slots for this assessment yet.")}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Session Selection Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TimeslotSelectionCalendar
              currentMonth={currentMonth}
              onNavigateMonth={navigateMonth}
              availableDates={getAvailableDates()}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <div className="dashboard-card p-5 lg:col-span-2">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <i className="fas fa-info-circle text-gray-500 mr-2"></i>
                  Click on sessions to select them. Your selections will be
                  shown in the summary below.
                  {isLoadingTimeslots && (
                    <span className="text-blue-600 dark:text-blue-400">
                      {" "}
                      Updating...
                    </span>
                  )}
                </p>
              </div>
              <OperationResultDialog
                open={resultDialogOpen}
                onOpenChange={setResultDialogOpen}
                {...resultDialogProps}
              />
              <TimeslotList
                isLoading={isLoadingTimeslots}
                error={timeslotsError}
                onRetry={() => refetchTimeslots()}
                timeSlots={
                  timeslotsData?.data?.sessions ||
                  timeslotsData?.data?.timeSlots ||
                  []
                }
                selectedDate={selectedDate}
                onToggleSlot={selectSlot}
                isSlotSelected={isSlotSelected}
                selectionMessage={selectionMessage}
              />
            </div>
          </div>

          {/* Selection Summary */}
          {allocatedSlots.length > 0 && (
            <SelectionSummary
              allocatedSlots={allocatedSlots}
              totalSessions={currentAllocation}
              onRemoveSlot={removeSlot}
              onClear={() => {
                setAllocatedSlots([]);
                setCurrentAllocation(0);
              }}
            />
          )}

          {/* Action buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/examiner/schedule")}
              className="flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Schedule
            </Button>

            <div className="flex flex-col items-end gap-2">
              {submitError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </div>
              )}
              {submitResult?.success && submitResult.data.partial && (
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  Partial success: {submitResult.data.assignedSlots.length}{" "}
                  assigned, {submitResult.data.failedSlots.length} failed
                </div>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit() || isSubmitting}
                className="flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Confirm {allocatedSlots.length} Selection
                    {allocatedSlots.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimeslotSelection() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TimeslotSelectionContent />
    </Suspense>
  );
}
