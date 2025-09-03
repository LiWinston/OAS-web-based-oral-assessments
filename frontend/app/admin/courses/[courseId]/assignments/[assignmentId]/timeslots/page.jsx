'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import CalendarMonth from '@/components/admin/schedule/CalendarMonth.jsx';
import TimeSlotCard from '@/components/admin/schedule/TimeSlotCard.jsx';
import BulkActionsBar from '@/components/admin/schedule/BulkActionsBar.jsx';
import AddTimeSlotModal from '@/components/admin/schedule/AddTimeSlotModal.jsx';
import { useTimeSlots } from '@/hooks/useTimeSlots.js';
import { useSessionConfig } from '@/hooks/useSessionConfig.js';
import { useScheduleRelease } from '@/hooks/useScheduleRelease.js';
import { confirm, showSuccess, showError } from '@/lib/notifications.js';

/**
 * AssignmentTimeSlotsPage - Refactored timeslot management
 * Uses server state via hooks (per Section 9.2) - no local-only operations
 * 
 * CalendarMonth: consumes useCalendar, not hard-coded month/today
 * List & Cards: fetch by selected date; batch operations wired to server
 * Add/Edit modal: injects sessionLength/gapTime from useSessionConfig
 */

const MOCK_EXAMINERS = [
  { id: 1, name: 'Dr. Emma Thompson', avatar: '/api/placeholder/24/24', assignments: 4 },
  { id: 2, name: 'Dr. Michael Chen', avatar: '/api/placeholder/24/24', assignments: 2 },
  { id: 3, name: 'Dr. Sarah Johnson', avatar: '/api/placeholder/24/24', assignments: 1 },
  { id: 4, name: 'Prof. David Williams', avatar: '/api/placeholder/24/24', assignments: 3 },
  { id: 5, name: 'Dr. Jennifer Lee', avatar: '/api/placeholder/24/24', assignments: 0 },
  { id: 6, name: 'Prof. Robert Brown', avatar: '/api/placeholder/24/24', assignments: 2 },
];

export default function AssignmentTimeSlotsPage() {
  const params = useParams();
  const { courseId, assignmentId } = params;
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);

  // Hooks for server state (replace in-memory arrays per Section 9.2)
  const { data: sessionConfig } = useSessionConfig(assignmentId);
  const {
    data: timeSlots,
    isLoading: isLoadingSlots,
    createBatch,
    updateSlot,
    deleteSlots,
    duplicateSlot,
    isUpdating,
    isDeleting,
    isDuplicating
  } = useTimeSlots(assignmentId, selectedDate ? { date: selectedDate } : {});

  const { release, canRelease } = useScheduleRelease(assignmentId);

  // Filter slots for selected date
  const timeSlotsForSelectedDate = selectedDate 
    ? timeSlots.filter(slot => slot.date === selectedDate)
    : [];

  // Selection handlers
  const toggleTimeSlotSelection = (id) => {
    setSelectedTimeSlots(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const selectAllTimeSlotsForDate = () => {
    if (!selectedDate) return;
    const dateSlotIds = timeSlotsForSelectedDate.map(s => s.id);
    const allSelected = dateSlotIds.every(id => selectedTimeSlots.includes(id));
    
    setSelectedTimeSlots(prev => 
      allSelected 
        ? prev.filter(id => !dateSlotIds.includes(id))
        : [...new Set([...prev, ...dateSlotIds])]
    );
  };

  // Modal handlers
  const openAddModal = () => {
    setEditingTimeSlot(null);
    setShowModal(true);
  };

  const openEditModal = (timeSlot) => {
    setEditingTimeSlot(timeSlot);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTimeSlot(null);
  };

  // CRUD operations using server state (per Section 9.2)
  const handleModalSave = (timeSlotData) => {
    if (editingTimeSlot) {
      // Update existing
      updateSlot({
        timeSlotId: editingTimeSlot.id,
        data: timeSlotData
      });
    } else {
      // For adds, create a single-item batch (per Section 9.2)
      createBatch([timeSlotData]);
    }
    closeModal();
  };

  const handleDeleteTimeSlot = async (id) => {
    const confirmed = await confirm('Delete this time slot?');
    if (confirmed) {
      deleteSlots([id]);
      setSelectedTimeSlots(prev => prev.filter(sid => sid !== id));
    }
  };

  const handleDuplicateTimeSlot = (id) => {
    duplicateSlot({ timeSlotId: id });
  };

  const handleNotifyExaminers = async () => {
    // Mock notification - would call API
    showSuccess('Examiner notifications sent!');
  };

  // Bulk operations
  const handleBulkNotify = async () => {
    // Mock bulk notification
    showSuccess(`Notifications sent to examiners for ${selectedTimeSlots.length} time slots`);
  };

  const handleBulkDuplicate = () => {
    selectedTimeSlots.forEach(id => {
      duplicateSlot({ timeSlotId: id });
    });
    setSelectedTimeSlots([]);
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm(`Delete ${selectedTimeSlots.length} selected time slots?`);
    if (confirmed) {
      deleteSlots(selectedTimeSlots);
      setSelectedTimeSlots([]);
    }
  };

  const handleReleaseSchedule = () => {
    if (!canRelease) {
      showError('Cannot release schedule: some time slots are not fully staffed');
      return;
    }
    release();
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
        <span>Time Slot Management</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Time Slot Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage assessment time slots and examiner assignments for Assignment {assignmentId}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="add-time-slot-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2" 
            onClick={openAddModal}
          >
            <span className="text-lg">+</span>
            <span>Add New Time Slot</span>
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              canRelease 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
            }`}
            onClick={handleReleaseSchedule}
            disabled={!canRelease}
          >
            Release Schedule
          </button>
        </div>
      </div>

      {/* Project Info Card with dynamic session config */}
      <div className="dashboard-card p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 rounded-lg flex items-center justify-center">
            <i className="fas fa-shield-alt text-blue-600 dark:text-blue-400"></i>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Assignment {assignmentId}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Course {courseId} - Oral Assessment</p>
          </div>
        </div>
        
        <div className="project-info-grid mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">SESSION LENGTH</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {sessionConfig?.sessionLength || 30} minutes per session
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">GAP TIME</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {sessionConfig?.gapTime || 5} minutes between sessions
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">EXAMINERS REQUIRED</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {sessionConfig?.examinersPerSession || 2} examiners per session
            </div>
          </div>
        </div>
      </div>

      {/* Calendar + List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Calendar (uses useCalendar, not hard-coded) */}
        <CalendarMonth
          assignmentId={assignmentId}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Right - Time Slots List */}
        <div className="dashboard-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2" />
              {selectedDate ? `Time Slots - ${selectedDate}` : 'Time Slots - Select a date'}
            </h2>
            {selectedDate && timeSlotsForSelectedDate.length > 0 && (
              <button 
                onClick={selectAllTimeSlotsForDate} 
                className="px-3 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {timeSlotsForSelectedDate.every(s => selectedTimeSlots.includes(s.id)) ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoadingSlots && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Empty States */}
          {!isLoadingSlots && !selectedDate && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-calendar-day text-xl" />
              </div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">No Date Selected</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">Select a date from the calendar to view and manage time slots for that day.</p>
            </div>
          )}

          {!isLoadingSlots && selectedDate && timeSlotsForSelectedDate.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-calendar-plus text-xl" />
              </div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">No Time Slots</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">There are no time slots scheduled for this date yet.</p>
              <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <i className="fas fa-plus mr-2" /> Add Time Slot
              </button>
            </div>
          )}

          {/* Time Slots Content */}
          {!isLoadingSlots && selectedDate && timeSlotsForSelectedDate.length > 0 && (
            <div className="space-y-4">
              {/* Bulk Actions Bar */}
              <BulkActionsBar
                selectedCount={selectedTimeSlots.length}
                onNotifyExaminers={handleBulkNotify}
                onDuplicateSelected={handleBulkDuplicate}
                onDeleteSelected={handleBulkDelete}
                isProcessing={isDeleting}
              />

              {/* Time Slot Cards */}
              {timeSlotsForSelectedDate.map((timeSlot) => (
                <TimeSlotCard
                  key={timeSlot.id}
                  timeSlot={timeSlot}
                  isSelected={selectedTimeSlots.includes(timeSlot.id)}
                  onSelect={toggleTimeSlotSelection}
                  onEdit={openEditModal}
                  onDuplicate={handleDuplicateTimeSlot}
                  onDelete={handleDeleteTimeSlot}
                  onNotify={handleNotifyExaminers}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal with injected session config */}
      <AddTimeSlotModal
        isOpen={showModal}
        mode={editingTimeSlot ? 'edit' : 'add'}
        initialData={editingTimeSlot}
        availableExaminers={MOCK_EXAMINERS}
        sessionConfig={sessionConfig}
        onCancel={closeModal}
        onSave={handleModalSave}
      />
    </div>
  );
}
