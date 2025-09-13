'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
// Removed SessionConfigStep: Part 1 (session config) is no longer used
import TimeSlotForm from '@/components/admin/schedule/TimeSlotForm.jsx';
import DraftSessionsList from '@/components/admin/schedule/DraftSessionsList.jsx';
import ExaminerLimitsStep from '@/components/admin/schedule/ExaminerLimitsStep.jsx';
// No backend mutations in this UI-only pass
import { useExaminerLimits } from '@/hooks/useExaminerLimits.js';
import { showSuccess, showError } from '@/lib/notifications.js';
// No API calls in this pass

/**
 * AssignmentSchedulePage - Refactored 3-step wizard
 * Uses hooks only (per Section 9.1) - pages = composition & routing
 * 
 * Step 1: Batch Create Sessions (use modal + local list)
 * Step 2: Examiner Session Limits
 * Complete Setup → route to Sessions Management
 */

export default function AssignmentSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const { courseId, assignmentId } = params;
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Step 2 - Local draft time slots (accumulated locally)
  const [draftTimeSlots, setDraftTimeSlots] = useState([]);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [draftSessions, setDraftSessions] = useState([]);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'duplicate'
  const [modalInitialSlot, setModalInitialSlot] = useState(null);

  // Hooks for server operations
  // UI-only: do not call backend here
  const isCreatingBatch = false;
  const { data: examiners = [] } = useExaminerLimits(assignmentId);

  const progressPercent = useMemo(() => (currentStep / totalSteps) * 100, [currentStep]);

  // No prefill: this pass uses local-only draft sessions

  // Step 1 handlers
  const handleStep1Next = () => setCurrentStep(2);

  // Step 2 handlers - draft slots management
  const handleAddTimeSlot = (payload) => {
    const sessions = Array.isArray(payload) ? payload : [payload];
    setDraftSessions((prev) => [...prev, ...sessions]);
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

  const getTotalSessions = () => draftSessions.length;

  const getTotalAssignedSessions = () => {
    return examiners.reduce((total, examiner) => total + (examiner.maxSessions || 0), 0);
  };

  // Step 1 "Next" (now former Step 2) — UI only
  const handleStep1Done = () => {
    if (draftTimeSlots.length === 0) {
      showError('Please add at least one session');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Previous = () => setCurrentStep(1);

  // Step 3 handlers
  // No step 3 in this flow

  const handleStep2Complete = () => {
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Batch create sessions and set examiner limits</p>
        </div>
      </div>

      <div className="oas-schedule dashboard-card p-5">
        {/* Progress bar */}
        <div className="mb-5">
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Step 1: Batch Create Sessions (formerly Time Slots) */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <div className="dashboard-card p-5 mb-6">
              <div className="flex items-center mb-5">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mr-3">
                  <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Batch Create Sessions</h2>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg border border-blue-100 dark:border-blue-800 mb-5">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <i className="fas fa-info-circle mr-2" /> Define sessions quickly using count, length, gap time, start time, and venue.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  className="add-time-slot-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                  onClick={openAddSlotModal}
                >
                  <span className="text-lg">+</span>
                  <span>Batch Create</span>
                </button>
              </div>
            </div>

            <div className="dashboard-card p-5">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">Draft Sessions: {draftSessions.length}</div>
              <DraftSessionsList 
                sessions={draftSessions}
                onDeleteOne={(id) => setDraftSessions((prev) => prev.filter((s) => s.id !== id))}
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-end mt-6">
              <button 
                onClick={handleStep1Done} 
                className="btn btn-primary" 
                disabled={draftSessions.length === 0}
              >
                <i className="fas fa-check mr-1.5" />
                <span>Next</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Examiner Session Limits */}
        {currentStep === 2 && (
          <ExaminerLimitsStep 
            assignmentId={assignmentId}
            totalSessions={getTotalSessions()}
            onPrevious={handleStep2Previous}
            onComplete={handleStep2Complete}
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
                Batch Create Sessions
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
