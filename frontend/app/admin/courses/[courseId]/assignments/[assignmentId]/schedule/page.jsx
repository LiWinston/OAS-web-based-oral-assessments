'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SessionConfigStep from '@/components/admin/schedule/SessionConfigStep.jsx';
import TimeSlotForm from '@/components/admin/schedule/TimeSlotForm.jsx';
import TimeSlotList from '@/components/admin/schedule/TimeSlotList.jsx';
import ExaminerLimitsStep from '@/components/admin/schedule/ExaminerLimitsStep.jsx';
import { useTimeSlots } from '@/hooks/useTimeSlots.js';
import { useExaminerLimits } from '@/hooks/useExaminerLimits.js';
import { showSuccess, showError } from '@/lib/notifications.js';
import { courseAdminTimeslotService } from '@/services/courseAdminTimeslotService.js';
import { mapTimeSlotsFromApi } from '@/lib/timeslotMappers.js';

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
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'duplicate'
  const [modalInitialSlot, setModalInitialSlot] = useState(null);
  const hasPrefilledRef = useRef(false);

  // Hooks for server operations
  // Disable fetching here; Step 2 uses local draft slots and only needs createBatch
  const { createBatch, isCreatingBatch } = useTimeSlots(assignmentId, {}, { enabled: false });
  const { data: examiners = [] } = useExaminerLimits(assignmentId);

  const progressPercent = useMemo(() => (currentStep / totalSteps) * 100, [currentStep]);

  // Prefill Step 2 with existing time slots from backend (one-time per entry into Step 2)
  useEffect(() => {
    if (currentStep !== 2 || hasPrefilledRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await courseAdminTimeslotService.getTimeSlots(assignmentId, {});
        if (!cancelled && resp?.success && Array.isArray(resp.data)) {
          const mapped = mapTimeSlotsFromApi(resp.data);
          setDraftTimeSlots(mapped);
          hasPrefilledRef.current = true;
        }
      } catch (e) {
        // Ignore; keep local drafts if fetch fails
        console.warn('[Schedule Step 2] Failed to prefill time slots', e);
      }
    })();
    return () => { cancelled = true; };
  }, [currentStep, assignmentId]);

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

  const openAddSlotModal = () => {
    setEditingSlotIndex(null);
    setModalMode('add');
    setModalInitialSlot(null);
    setShowSlotModal(true);
  };

  const handleEditTimeSlot = (index) => {
    setEditingSlotIndex(index);
    setModalMode('edit');
    setModalInitialSlot(draftTimeSlots[index]);
    setShowSlotModal(true);
  };

  const handleCancelEdit = () => {
    setEditingSlotIndex(null);
  };

  const handleDuplicateTimeSlot = (index) => {
    setEditingSlotIndex(null); // treat as add
    setModalMode('duplicate');
    setModalInitialSlot({ ...draftTimeSlots[index], id: undefined });
    setShowSlotModal(true);
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

              <div className="flex justify-end">
                <button
                  className="add-time-slot-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                  onClick={openAddSlotModal}
                >
                  <span className="text-lg">+</span>
                  <span>Add New Time Slot</span>
                </button>
              </div>
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

      {/* Add/Edit Time Slot Modal (uses TimeSlotForm) */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => {
              setShowSlotModal(false);
              setEditingSlotIndex(null);
            }}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                {modalMode === 'edit' ? 'Edit Time Slot' : 'Add New Time Slot'}
              </h3>
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  setEditingSlotIndex(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <TimeSlotForm
              assignmentId={assignmentId}
              onAddTimeSlot={(slot) => {
                handleAddTimeSlot(slot);
                setShowSlotModal(false);
              }}
              editingSlot={modalMode === 'edit' ? modalInitialSlot : (modalMode === 'duplicate' ? modalInitialSlot : null)}
              onCancelEdit={() => {
                setShowSlotModal(false);
                handleCancelEdit();
              }}
              submitLabel="Done"
            />
          </div>
        </div>
      )}
    </div>
  );
}
