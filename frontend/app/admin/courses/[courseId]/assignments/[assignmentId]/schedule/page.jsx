'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SessionConfigStep from '@/components/admin/schedule/SessionConfigStep.jsx';
import TimeSlotForm from '@/components/admin/schedule/TimeSlotForm.jsx';
import TimeSlotList from '@/components/admin/schedule/TimeSlotList.jsx';
import ExaminerLimitsStep from '@/components/admin/schedule/ExaminerLimitsStep.jsx';
import { useTimeSlots } from '@/hooks/useTimeSlots.js';
import { useExaminerLimits } from '@/hooks/useExaminerLimits.js';
import { showSuccess, showError } from '@/lib/notifications.js';

/**
 * AssignmentSchedulePage - Refactored 3-step wizard
 * Uses hooks only (per Section 9.1) - pages = composition & routing
 * 
 * Step 1: SessionConfigStep - reads/writes via useSessionConfig
 * Step 2: TimeSlotForm & TimeSlotList - accumulate draft slots locally, "Done" calls createTimeSlotsBatch()
 * Step 3: ExaminerLimitsStep - loads examiners and mutates limits via hook
 * Complete Setup → success toast + route to Timeslot Management
 */

export default function AssignmentSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const { courseId, assignmentId } = params;
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 2 - Local draft time slots (accumulated locally)
  const [draftTimeSlots, setDraftTimeSlots] = useState([]);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);

  // Hooks for server operations
  // Disable fetching here; Step 2 uses local draft slots and only needs createBatch
  const { createBatch, isCreatingBatch } = useTimeSlots(assignmentId, {}, { enabled: false });
  const { data: examiners = [] } = useExaminerLimits(assignmentId);

  const progressPercent = useMemo(() => (currentStep / totalSteps) * 100, [currentStep]);

  // Step 1 handlers
  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  // Step 2 handlers - draft slots management
  const handleAddTimeSlot = (timeSlotData) => {
    if (editingSlotIndex !== null) {
      // Update existing slot
      const updatedSlots = [...draftTimeSlots];
      updatedSlots[editingSlotIndex] = {
        ...timeSlotData,
        id: updatedSlots[editingSlotIndex].id
      };
      setDraftTimeSlots(updatedSlots);
      setEditingSlotIndex(null);
    } else {
      // Add new slot
      const newId = draftTimeSlots.length > 0 ? Math.max(...draftTimeSlots.map(s => s.id || 0)) + 1 : 1;
      setDraftTimeSlots([...draftTimeSlots, {
        ...timeSlotData,
        id: newId
      }]);
    }
  };

  const handleEditTimeSlot = (index) => {
    setEditingSlotIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingSlotIndex(null);
  };

  const handleDuplicateTimeSlot = (index) => {
    const originalSlot = draftTimeSlots[index];
    const newId = Math.max(...draftTimeSlots.map(s => s.id || 0)) + 1;
    
    // Increment date by 1 day by default (per Section 1.1)
    const originalDate = new Date(originalSlot.date + 'T00:00:00');
    originalDate.setDate(originalDate.getDate() + 1);
    const newDate = originalDate.toISOString().split('T')[0];

    setDraftTimeSlots([...draftTimeSlots, { 
      ...originalSlot, 
      id: newId,
      date: newDate,
      assignedExaminers: [],
      status: 'empty'
    }]);
  };

  const handleDeleteTimeSlot = (index) => {
    setDraftTimeSlots(draftTimeSlots.filter((_, i) => i !== index));
    if (editingSlotIndex === index) {
      setEditingSlotIndex(null);
    } else if (editingSlotIndex !== null && editingSlotIndex > index) {
      setEditingSlotIndex(editingSlotIndex - 1);
    }
  };

  const getTotalSessions = () => {
    return draftTimeSlots.reduce((total, slot) => total + (slot.sessionCount || 0), 0);
  };

  const getTotalAssignedSessions = () => {
    return examiners.reduce((total, examiner) => total + (examiner.maxSessions || 0), 0);
  };

  // Step 2 "Done" - calls createTimeSlotsBatch (per Section 8)
  const handleStep2Done = () => {
    if (draftTimeSlots.length === 0) {
      showError('Please add at least one time slot');
      return;
    }

    createBatch(draftTimeSlots, {
      onSuccess: () => {
        setCurrentStep(3);
      }
    });
  };

  const handleStep2Previous = () => {
    setCurrentStep(1);
  };

  // Step 3 handlers
  const handleStep3Previous = () => {
    setCurrentStep(2);
  };

  const handleStep3Complete = () => {
    // Success toast + route to Timeslot Management (per Section 9.1)
    showSuccess('Assessment setup completed successfully!');
    router.push(`/admin/courses/${courseId}/assignments/${assignmentId}/timeslots`);
  };

  return (
    <div className="oas-schedule space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="breadcrumb-link cursor-pointer">OAS Dashboard</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span className="breadcrumb-link cursor-pointer">Assignments</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span className="breadcrumb-link cursor-pointer">Assignment {assignmentId}</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span>Create Schedule</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Assessment Schedule</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Configure assessment sessions and scheduling time slots</p>
        </div>
      </div>

      <div className="oas-schedule dashboard-card p-5">
        {/* Progress bar */}
        <div className="mb-5">
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Step 1: Session Configuration */}
        {currentStep === 1 && (
          <SessionConfigStep 
            assignmentId={assignmentId}
            onNext={handleStep1Next}
          />
        )}

        {/* Step 2: Assessment Time Slots */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <div className="dashboard-card p-5 mb-6">
              <div className="flex items-center mb-5">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mr-3">
                  <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Add Assessment Time Slots</h2>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg border border-blue-100 dark:border-blue-800 mb-5">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <i className="fas fa-info-circle mr-2" /> Define time slots for assessments. Each time slot represents a block of consecutive sessions at a specific venue.
                </p>
              </div>

              <TimeSlotForm
                assignmentId={assignmentId}
                onAddTimeSlot={handleAddTimeSlot}
                editingSlot={editingSlotIndex !== null ? draftTimeSlots[editingSlotIndex] : null}
                onCancelEdit={handleCancelEdit}
              />
            </div>

            <TimeSlotList
              timeSlots={draftTimeSlots}
              onEditTimeSlot={handleEditTimeSlot}
              onDuplicateTimeSlot={handleDuplicateTimeSlot}
              onDeleteTimeSlot={handleDeleteTimeSlot}
              totalSessions={getTotalSessions()}
              totalAssignedSessions={getTotalAssignedSessions()}
              availableExaminers={examiners.length}
            />

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <button onClick={handleStep2Previous} className="btn btn-secondary">
                <i className="fas fa-arrow-left mr-2" />
                <span>Previous</span>
              </button>

              <button 
                onClick={handleStep2Done} 
                className="btn btn-primary" 
                disabled={draftTimeSlots.length === 0 || isCreatingBatch}
              >
                {isCreatingBatch ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-1.5" />
                    <span>Done</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Examiner Session Limits */}
        {currentStep === 3 && (
          <ExaminerLimitsStep 
            assignmentId={assignmentId}
            totalSessions={getTotalSessions()}
            onPrevious={handleStep3Previous}
            onComplete={handleStep3Complete}
          />
        )}
      </div>
    </div>
  );
}
