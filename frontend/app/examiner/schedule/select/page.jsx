"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button";
import { examinerTimeslotService } from "../../../../services/examinerTimeslotService";
import { useExaminerAuth } from "../../../../hooks/useExaminerAuth";
import { useTimeslotAssignment } from "../../../../hooks/useTimeslotAssignment";
import AssessmentSelectionStep from "../../../../components/examiner/schedule/AssessmentSelectionStep";
import TimeslotSelectionCalendar from "../../../../components/examiner/schedule/TimeslotSelectionCalendar";
import TimeslotList from "../../../../components/examiner/schedule/TimeslotList";
import SelectionSummary from "../../../../components/examiner/schedule/SelectionSummary";

/**
 * TimeslotSelection Component
 *
 * Two-step wizard for examiner timeslot self-assignment:
 * Step 1: Assessment Selection
 * Step 2: Timeslot Selection
 */
function TimeslotSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const {
    isSubmitting,
    submitError,
    submitResult,
    hasConflict,
    validateSelection,
    assignToTimeslots,
    clearErrors
  } = useTimeslotAssignment();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [allocatedSlots, setAllocatedSlots] = useState([]);
  const [currentAllocation, setCurrentAllocation] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionMessage, setSelectionMessage] = useState(null);

  // Clear errors when component mounts or step changes
  useEffect(() => {
    clearErrors();
  }, [currentStep, clearErrors]);

  // Fetch available assignments
  const { 
    data: assignmentsData, 
    isLoading: isLoadingAssignments, 
    error: assignmentsError,
    refetch: refetchAssignments
  } = useQuery({
    queryKey: ['availableAssignments', examinerId],
    queryFn: () => examinerTimeslotService.getAvailableAssignments(examinerId),
    enabled: isValidExaminer && currentStep === 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });


  // Fetch available timeslots when assignment is selected and on step 2
  const { 
    data: timeslotsData, 
    isLoading: isLoadingTimeslots, 
    error: timeslotsError,
    refetch: refetchTimeslots
  } = useQuery({
    queryKey: ['availableTimeslots', selectedAssignment?.assignmentId, examinerId],
    queryFn: () => examinerTimeslotService.getAvailableTimeslots(
      selectedAssignment.assignmentId, 
      { examinerId }
    ),
    enabled: !!selectedAssignment && isValidExaminer && currentStep === 2,
    refetchInterval: 60000, // 1 minute - reduced from 30s
    staleTime: 30000, // 30 seconds - increased from 10s
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

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

  // Get available dates from API data
  const getAvailableDates = () => {
    if (!timeslotsData?.success || !timeslotsData.data.timeSlots) {
      return [];
    }
    
    const dates = new Set();
    timeslotsData.data.timeSlots.forEach(slot => {
      const date = new Date(slot.start).toISOString().split('T')[0];
      dates.add(date);
    });
    
    return Array.from(dates);
  };

  const dateHasSlots = (date) => {
    return getAvailableDates().includes(date);
  };


  const selectSlot = (slot) => {
    setSelectionMessage(null);
    const slotIndex = allocatedSlots.findIndex((s) => s.slotId === slot.slotId);
    
    if (slotIndex >= 0) {
      // Remove slot
      const removedSessions = allocatedSlots[slotIndex].sessionCount;
      const newSlots = allocatedSlots.filter((s) => s.slotId !== slot.slotId);
      setAllocatedSlots(newSlots);
      setCurrentAllocation(currentAllocation - removedSessions);
    } else {
      // Add slot with validation
      const maxSessions = selectedAssignment?.examinerInfo?.maxSessions || 12;
      const validation = validateSelection(slot, allocatedSlots, maxSessions);
      
      if (!validation.valid) {
        setSelectionMessage({ type: 'error', text: validation.reason });
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
        showNotification('warning', 'Please select an assessment to continue');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Clear timeslot selections when going back
      setAllocatedSlots([]);
      setCurrentAllocation(0);
      setSelectedDate(null);
      setSelectionMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !selectedAssignment) return;

    try {
      await assignToTimeslots(selectedAssignment.assignmentId, allocatedSlots);
    } catch (error) {
      // Error handling is managed by the hook
      console.error('Submit error:', error);
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
                Time Slot Selection
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Time Slot Selection
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Browse and select time slots for upcoming assessments within your
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
                Choose Time Slots
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
        />
      )}

      {/* Step 2: Timeslot Selection */}
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

            {selectedAssignment && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-book text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">{selectedAssignment.courseCode}</span>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-clipboard-check text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">
                    {selectedAssignment.assignmentName}
                  </span>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-users text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">{selectedAssignment.assessmentType} Assessment</span>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-clock text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">{selectedAssignment.sessionDurationMinutes} min per session</span>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <i className="fas fa-chart-bar text-gray-400 mr-2"></i>
                  <span className="text-sm font-medium">Sessions: {currentAllocation}/{selectedAssignment.examinerInfo.maxSessions}</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeslot Selection Interface */}
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
                  Click on time slots to select them. Your selections will be shown in the summary below.
                  {isLoadingTimeslots && <span className="text-blue-600 dark:text-blue-400"> Updating...</span>}
                </p>
              </div>
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
