"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button";
import { examinerTimeslotService } from "../../../../services/examinerTimeslotService";
import { useExaminerAuth } from "../../../../hooks/useExaminerAuth";
import AssessmentSelectionStep from "../../../../components/examiner/schedule/AssessmentSelectionStep";
import TimeslotSelectionCalendar from "../../../../components/examiner/schedule/TimeslotSelectionCalendar";
import TimeslotList from "../../../../components/examiner/schedule/TimeslotList";
import SelectionSummary from "../../../../components/examiner/schedule/SelectionSummary";
import OperationResultDialog from "@/components/examiner/schedule/OperationResultDialog";
import { toLocalDateKey } from "@/utils/dateUtils";

/**
 * SessionSelection Component (name retained in files for compatibility)
 *
 * Two-step wizard for examiner session self-assignment:
 * Step 1: Assessment Selection
 * Step 2: Session Selection
 */
function TimeslotSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { examinerId, isValidExaminer } = useExaminerAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
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
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Debug - Examiner Auth:', {
        examinerId,
        isValidExaminer
      });
    }
  }, [examinerId, isValidExaminer]);

  // Fetch available assignments with debugging
  const { 
    data: assignmentsData, 
    isLoading: isLoadingAssignments, 
    error: assignmentsError,
    refetch: refetchAssignments
  } = useQuery({
    queryKey: ['availableAssignments', examinerId],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 API Call - Getting available assignments for examiner:', examinerId);
      }
      try {
        const result = await examinerTimeslotService.getAvailableAssignments(examinerId);
        if (process.env.NODE_ENV === 'development') {
          console.log('📦 API Response - Available assignments:', result);
        }
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ API Error - Failed to fetch assignments:', error);
        }
        throw error;
      }
    },
    enabled: isValidExaminer && !!examinerId && currentStep === 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Debug assignments data changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && assignmentsData) {
      console.log('📊 Debug - Assignments data updated:', {
        success: assignmentsData?.success,
        dataLength: assignmentsData?.data?.data?.length || 0,
        totalAssignments: assignmentsData?.data?.total || 0,
        errorPresent: !!assignmentsError
      });
    }
  }, [assignmentsData, assignmentsError]);

  // Fetch available sessions when assignment is selected and on step 2
  const { 
    data: timeslotsData, 
    isLoading: isLoadingTimeslots, 
    error: timeslotsError,
    refetch: refetchTimeslots
  } = useQuery({
    queryKey: ['availableTimeslots', selectedAssignment?.assignmentId, examinerId],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 API Call - Getting available sessions:', {
          assignmentId: selectedAssignment.assignmentId,
          examinerId: examinerId
        });
      }
      try {
        const result = await examinerTimeslotService.getAvailableTimeslots(
          selectedAssignment.assignmentId, 
          { examinerId }
        );
        if (process.env.NODE_ENV === 'development') {
          console.log('📦 API Response - Available sessions:', result);
        }
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ API Error - Failed to fetch sessions:', error);
        }
        throw error;
      }
    },
    enabled: !!selectedAssignment && isValidExaminer && !!examinerId && currentStep === 2,
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Availability summary for step 2 banner
  const availabilitySummary = useMemo(() => {
    if (!timeslotsData?.success || !timeslotsData.data?.timeSlots) return null;
    const slots = timeslotsData.data.timeSlots;
    const selectable = slots.filter(s => s?.availability?.canSelect);
    const reasonsMap = slots
      .filter(s => !s?.availability?.canSelect && s?.availability?.reason)
      .reduce((acc, s) => {
        const r = s.availability.reason;
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
    let primaryReason = null;
    if (selectable.length === 0) {
      const arr = Object.entries(reasonsMap).sort((a,b) => b[1]-a[1]);
      if (arr.length > 0) primaryReason = arr[0][0];
    }
    return {
      hasAny: slots.length > 0,
      hasSelectable: selectable.length > 0,
      primaryReason,
      reasonsMap
    };
  }, [timeslotsData]);

  // Pre-fill if coming from assignment link
  useEffect(() => {
    const assignmentId = searchParams.get("assignmentId");
    if (assignmentId && assignmentsData?.success) {
      const assignment = assignmentsData.data.data.find(
        a => a.assignmentId === parseInt(assignmentId)
      );
      if (assignment) {
        setSelectedAssignment(assignment);
        setCurrentStep(2);
      }
    }
  }, [searchParams, assignmentsData]);

  // Prefer assignment and examiner info from sessions API payload when available
  const maxSessions = useMemo(() => (
    timeslotsData?.data?.examinerInfo?.maxSessions ?? selectedAssignment?.examinerInfo?.maxSessions ?? 12
  ), [timeslotsData, selectedAssignment]);
  const summaryAssignment = useMemo(() => ({
    ...(timeslotsData?.data?.assignment || {}),
    ...(selectedAssignment || {}),
  }), [timeslotsData, selectedAssignment]);

  // Get available dates from API data
  const getAvailableDates = () => {
    if (!timeslotsData?.success || !timeslotsData.data.timeSlots) {
      return [];
    }
    
    const dates = new Set();
    timeslotsData.data.timeSlots.forEach(slot => {
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
        setSelectionMessage({ type: 'error', text: `You have reached your maximum allocation of ${maxSessions} sessions.` });
        return;
      }
      const conflict = allocatedSlots.find((s) => hasConflict(s, slot));
      if (conflict) {
        setSelectionMessage({ type: 'error', text: 'This session conflicts with another selected session. Please choose a different time.' });
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

  const nextStep = () => {
    if (currentStep === 1) {
      if (selectedAssignment) {
        setCurrentStep(2);
      } else {
        alert("Please select an assessment.");
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Clear session selections when going back
      setAllocatedSlots([]);
      setCurrentAllocation(0);
      setSelectedDate(null);
      setSelectionMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !selectedAssignment) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);
    
    try {
      const slotAssignments = allocatedSlots.map(slot => ({
        slotId: slot.slotId
      }));

      const result = await examinerTimeslotService.assignExaminerToTimeslots(
        selectedAssignment.assignmentId,
        {
          examinerId,
          slotAssignments
        }
      );

      setSubmitResult(result);

      if (result.success) {
        // Invalidate schedule queries so main page reflects latest data
        queryClient.invalidateQueries({ queryKey: ['examinerSchedule'] });
        queryClient.invalidateQueries({ queryKey: ['examinerDay'] });
        queryClient.invalidateQueries({ queryKey: ['examinerWeek'] });
        queryClient.invalidateQueries({ queryKey: ['availableAssignments'] });
        queryClient.invalidateQueries({ queryKey: ['availableTimeslots', selectedAssignment?.assignmentId] });

        // Show modal dialog in the center with summary
        const details = (result.data?.assignedSlots || []).slice(0, 5).map((s) => {
          const match = allocatedSlots.find((x) => x.slotId === s.slotId) || {};
          const start = match.start ? new Date(match.start) : null;
          const end = match.end ? new Date(match.end) : null;
          if (start && end) {
            return `${start.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})} – ${end.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})}`;
          }
          return `Slot #${s.slotId}`;
        });
        setResultDialogProps({
          status: result.data?.partial ? 'warning' : 'success',
          title: result.data?.partial ? 'Partial Assignment Completed' : 'Sessions Assigned',
          message: result.data?.partial
            ? `Assigned ${result.data.assignedSlots.length} session(s), ${result.data.failedSlots.length} failed.`
            : `Successfully assigned ${result.data.assignedSlots.length} session(s).`,
          details,
          autoDismiss: true,
          autoDismissMs: 5000,
          onAutoDismiss: () => router.push('/examiner/schedule'),
          onPrimaryAction: () => router.push('/examiner/schedule'),
          primaryActionLabel: 'View My Schedule',
        });
        setResultDialogOpen(true);
      } else {
        const msg = result.message || 'Failed to submit selections';
        setSubmitError(msg);
        setResultDialogProps({
          status: 'error',
          title: 'Assignment Failed',
          message: msg,
          autoDismiss: false,
          primaryActionLabel: 'Close',
        });
        setResultDialogOpen(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError('Failed to submit selections. Please try again.');
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

      {/* Progress indicator */}
      <div className="dashboard-card p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            <i className="fas fa-tasks text-blue-600 dark:text-blue-400 mr-2"></i>
            Selection Process
          </h2>
          <div className="flex space-x-2">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  currentStep >= step
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span
                className={`text-xs font-semibold inline-block py-1 px-2 rounded-full ${
                  currentStep >= 1
                    ? "text-blue-600 bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50"
                    : "text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700"
                }`}
              >
                Step 1
              </span>
            </div>
            <div>
              <span
                className={`text-xs font-semibold inline-block py-1 px-2 rounded-full ${
                  currentStep >= 2
                    ? "text-blue-600 bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50"
                    : "text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700"
                }`}
              >
                Step 2
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 dark:bg-blue-600 transition-all duration-500"
              style={{ width: `${currentStep === 1 ? 50 : 100}%` }}
            ></div>
          </div>
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-gray-700 dark:text-gray-300">
                Select Assessment
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold inline-block text-gray-700 dark:text-gray-300">
                Choose Sessions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Assessment Selection */}
      {currentStep === 1 && (
        <AssessmentSelectionStep
          isLoading={isLoadingAssignments}
          error={assignmentsError}
          assignments={assignmentsData?.data?.data || []}
          selectedAssignment={selectedAssignment}
          onSelectAssignment={setSelectedAssignment}
          onRetry={() => refetchAssignments()}
          onNext={nextStep}
          showDevInfo={process.env.NODE_ENV === 'development'}
          queryEnabled={!!examinerId && currentStep === 1}
        />
      )}

      {/* Step 2: Session Selection */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Assessment Summary */}
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                <i className="fas fa-clipboard-list text-blue-600 dark:text-blue-400 mr-2"></i>
                Assessment Summary
              </h2>
            </div>

            {summaryAssignment && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-book text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">{summaryAssignment.courseCode}</span>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-clipboard-check text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">{summaryAssignment.assignmentName}</span>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-users text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">{(summaryAssignment.assessmentType || summaryAssignment.type || '').toString().toUpperCase()} Assessment</span>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-chart-bar text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">Sessions: {currentAllocation}/{maxSessions}</span>
                </div>
              </div>
            )}
          </div>

          {/* Availability Banner */}
          {!isLoadingTimeslots && availabilitySummary && !availabilitySummary.hasSelectable && (
            <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
              <div className="flex items-start">
                <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 mr-3 mt-0.5"></i>
                <div>
                  <div className="font-medium text-amber-800 dark:text-amber-200">
                    {availabilitySummary.primaryReason === 'SLOT_FULL' && 'Fully Staffed'}
                    {availabilitySummary.primaryReason === 'TIME_CONFLICT' && 'All Slots Conflict With Your Schedule'}
                    {availabilitySummary.primaryReason === 'ALREADY_ASSIGNED' && 'You Are Already Assigned To These Slots'}
                    {!availabilitySummary.primaryReason && (
                      availabilitySummary.hasAny ? 'No Selectable Slots Available' : 'No Slots Configured Yet'
                    )}
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    {availabilitySummary.primaryReason === 'SLOT_FULL' && 'Please wait for the course admin to add more slots or for capacity to become available.'}
                    {availabilitySummary.primaryReason === 'TIME_CONFLICT' && 'Try a different time range, or withdraw from conflicting slots in your schedule.'}
                    {availabilitySummary.primaryReason === 'ALREADY_ASSIGNED' && 'You are already assigned across the current sessions.'}
                    {!availabilitySummary.primaryReason && (
                      availabilitySummary.hasAny ? 'All current slots are unavailable for selection.' : 'Course admin has not configured any slots for this assessment yet.'
                    )}
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
                  Click on sessions to select them. Your selections will be shown in the summary below.
                  {isLoadingTimeslots && <span className="text-blue-600 dark:text-blue-400"> Updating...</span>}
                </p>
              </div>
              <OperationResultDialog open={resultDialogOpen} onOpenChange={setResultDialogOpen} {...resultDialogProps} />
              <TimeslotList
                isLoading={isLoadingTimeslots}
                error={timeslotsError}
                onRetry={() => refetchTimeslots()}
                timeSlots={timeslotsData?.data?.timeSlots || []}
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
              onClear={() => { setAllocatedSlots([]); setCurrentAllocation(0); }}
            />
          )}

          {/* Action buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Assessment Selection
            </Button>

            <div className="flex flex-col items-end gap-2">
              {submitError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </div>
              )}
              {submitResult?.success && submitResult.data.partial && (
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  Partial success: {submitResult.data.assignedSlots.length} assigned, {submitResult.data.failedSlots.length} failed
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
                    Confirm {allocatedSlots.length} Selection{allocatedSlots.length !== 1 ? 's' : ''}
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
