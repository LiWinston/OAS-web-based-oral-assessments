'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Mock examiners data
const MOCK_EXAMINERS = [
  { id: 1, name: 'Dr. John Smith', maxSessions: 40 },
  { id: 2, name: 'Prof. Sarah Johnson', maxSessions: 40 },
  { id: 3, name: 'Dr. Michael Brown', maxSessions: 40 },
  { id: 4, name: 'Prof. Emily Davis', maxSessions: 40 },
];

export default function AssignmentSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const { courseId, assignmentId } = params;
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [sessionLength, setSessionLength] = useState(15);
  const [gapTime, setGapTime] = useState(5);
  const [examinersPerSession, setExaminersPerSession] = useState(2);

  const [timeSlots, setTimeSlots] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Form state for adding time slots
  const [timeSlotStartDate, setTimeSlotStartDate] = useState('');
  const [timeSlotStartTimeHour, setTimeSlotStartTimeHour] = useState('9');
  const [timeSlotStartTimeMinute, setTimeSlotStartTimeMinute] = useState('00');
  const [timeSlotStartTimeAMPM, setTimeSlotStartTimeAMPM] = useState('AM');
  const [sessionCount, setSessionCount] = useState(9);
  const [timeSlotVenue, setTimeSlotVenue] = useState('');

  // Examiners state for step 3
  const [examiners, setExaminers] = useState(MOCK_EXAMINERS);

  const progressPercent = useMemo(() => (currentStep / totalSteps) * 100, [currentStep]);

  const calculateEndTime = () => {
    if (!timeSlotStartDate || sessionCount <= 0) return 'N/A';
    
    let startHour = parseInt(timeSlotStartTimeHour);
    const startMinute = parseInt(timeSlotStartTimeMinute);
    
    // Convert 12-hour to 24-hour format
    if (timeSlotStartTimeAMPM === 'PM' && startHour < 12) {
      startHour += 12;
    } else if (timeSlotStartTimeAMPM === 'AM' && startHour === 12) {
      startHour = 0;
    }
    
    // Calculate total minutes for all sessions
    const totalSessionTime = sessionCount * sessionLength;
    const totalGapTime = (sessionCount - 1) * gapTime;
    const totalMinutes = totalSessionTime + totalGapTime;
    
    // Calculate end time
    let endHour = startHour + Math.floor((startMinute + totalMinutes) / 60);
    let endMinute = (startMinute + totalMinutes) % 60;
    
    // Convert back to 12-hour format
    let endAMPM = 'AM';
    if (endHour >= 12) {
      endAMPM = 'PM';
      if (endHour > 12) {
        endHour -= 12;
      }
    }
    if (endHour === 0) {
      endHour = 12;
    }
    
    return `${endHour}:${endMinute.toString().padStart(2, '0')} ${endAMPM}`;
  };

  const formatTime = (hour, minute, ampm) => {
    return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const validateStep1 = () => {
    return sessionLength > 0 && gapTime >= 0 && examinersPerSession > 0;
  };

  const validateStep2 = () => {
    return timeSlots.length > 0;
  };

  const getTotalSessions = () => {
    return timeSlots.reduce((total, slot) => total + slot.sessionCount, 0);
  };

  const getTotalAssignedSessions = () => {
    return examiners.reduce((total, examiner) => total + examiner.maxSessions, 0);
  };

  const addTimeSlot = () => {
    if (!timeSlotStartDate || !timeSlotVenue || sessionCount <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    const startTime = formatTime(timeSlotStartTimeHour, timeSlotStartTimeMinute, timeSlotStartTimeAMPM);
    const endTime = calculateEndTime();
    
    if (editingIndex !== null) {
      // Update existing time slot
      const updatedSlots = [...timeSlots];
      updatedSlots[editingIndex] = {
        id: timeSlots[editingIndex].id,
        startDate: timeSlotStartDate,
        startTime: startTime,
        sessionCount: sessionCount,
        endTime: endTime,
        venue: timeSlotVenue
      };
      setTimeSlots(updatedSlots);
      setEditingIndex(null);
    } else {
      // Add new time slot
      const newId = timeSlots.length > 0 ? Math.max(...timeSlots.map(s => s.id)) + 1 : 1;
      setTimeSlots([...timeSlots, {
        id: newId,
        startDate: timeSlotStartDate,
        startTime: startTime,
        sessionCount: sessionCount,
        endTime: endTime,
        venue: timeSlotVenue
      }]);
    }
    
    // Reset form
    setTimeSlotStartDate('');
    setTimeSlotStartTimeHour('9');
    setTimeSlotStartTimeMinute('00');
    setTimeSlotStartTimeAMPM('AM');
    setSessionCount(9);
    setTimeSlotVenue('');
  };

  const editTimeSlot = (index) => {
    const timeSlot = timeSlots[index];
    setEditingIndex(index);
    
    setTimeSlotStartDate(timeSlot.startDate);
    
    // Parse time
    const timeParts = timeSlot.startTime.split(' ');
    const [hour, minute] = timeParts[0].split(':');
    
    setTimeSlotStartTimeHour(hour);
    setTimeSlotStartTimeMinute(minute);
    setTimeSlotStartTimeAMPM(timeParts[1]);
    
    setSessionCount(timeSlot.sessionCount);
    setTimeSlotVenue(timeSlot.venue);
  };

  const duplicateTimeSlot = (index) => {
    const timeSlot = timeSlots[index];
    const newId = Math.max(...timeSlots.map(s => s.id)) + 1;
    setTimeSlots([...timeSlots, { ...timeSlot, id: newId }]);
  };

  const deleteTimeSlot = (index) => {
    if (confirm('Are you sure you want to delete this time slot?')) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      alert('Please fill in all required fields with valid values');
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeSetup = () => {
    if (!validateStep2()) {
      alert('Please add at least one time slot');
      return;
    }
    
    alert('Assessment setup completed successfully!');
    // Navigate to timeslots page for this assignment
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

        {/* Step 1: Define Oral Assessment Session */}
        {currentStep === 1 && (
          <div className="dashboard-card p-5 mb-6 animate-fade-in">
            <div className="flex items-center mb-5">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mr-3">
                <i className="fas fa-sliders-h text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Session Configuration</h2>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg border border-blue-100 dark:border-blue-800 mb-5">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <i className="fas fa-info-circle mr-2" /> Define the parameters for each oral assessment session. These settings will apply to all sessions created in the next step.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session length */}
              <div className="card-section">
                <div className="card-section-header">
                  <div className="card-section-icon icon-blue">
                    <i className="fas fa-clock" />
                  </div>
                  <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Session Length</h3>
                </div>
                <div className="form-field">
                  <label htmlFor="sessionLength" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minutes per session
                    <span className="info-tooltip">
                      <i className="fas fa-info-circle" />
                      <span className="tooltip-text">How long each individual assessment session will last</span>
                    </span>
                  </label>
                  <div className="number-input-container">
                    <button className="number-btn" onClick={() => setSessionLength(Math.max(1, sessionLength - 5))} title="Decrease session length">
                      <i className="fas fa-minus" />
                    </button>
                    <input
                      type="number"
                      id="sessionLength"
                      className="number-input"
                      min="1"
                      step="5"
                      value={sessionLength}
                      onChange={(e) => setSessionLength(Number(e.target.value) || 1)}
                    />
                    <button className="number-btn" onClick={() => setSessionLength(sessionLength + 5)} title="Increase session length">
                      <i className="fas fa-plus" />
                    </button>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">minutes</span>
                  </div>
                  <p className="helper-text">Recommended: 15-30 minutes depending on assessment complexity</p>
                </div>
              </div>

              {/* Gap time */}
              <div className="card-section">
                <div className="card-section-header">
                  <div className="card-section-icon icon-purple">
                    <i className="fas fa-hourglass-half" />
                  </div>
                  <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Gap Time</h3>
                </div>
                <div className="form-field">
                  <label htmlFor="gapTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minutes between sessions
                    <span className="info-tooltip">
                      <i className="fas fa-info-circle" />
                      <span className="tooltip-text">Time between consecutive sessions for examiners to prepare</span>
                    </span>
                  </label>
                  <div className="number-input-container">
                    <button className="number-btn" onClick={() => setGapTime(Math.max(0, gapTime - 1))} title="Decrease gap time">
                      <i className="fas fa-minus" />
                    </button>
                    <input
                      type="number"
                      id="gapTime"
                      className="number-input"
                      min="0"
                      step="1"
                      value={gapTime}
                      onChange={(e) => setGapTime(Number(e.target.value) || 0)}
                    />
                    <button className="number-btn" onClick={() => setGapTime(gapTime + 1)} title="Increase gap time">
                      <i className="fas fa-plus" />
                    </button>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">minutes</span>
                  </div>
                  <p className="helper-text">Recommended: 5-10 minutes for note-taking and transition</p>
                </div>
              </div>

              {/* Examiners count */}
              <div className="card-section">
                <div className="card-section-header">
                  <div className="card-section-icon icon-green">
                    <i className="fas fa-user-tie" />
                  </div>
                  <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Examiners</h3>
                </div>
                <div className="form-field">
                  <label htmlFor="examinersCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Examiners per session
                    <span className="info-tooltip">
                      <i className="fas fa-info-circle" />
                      <span className="tooltip-text">Number of examiners required for each assessment session</span>
                    </span>
                  </label>
                  <div className="number-input-container">
                    <button className="number-btn" onClick={() => setExaminersPerSession(Math.max(1, examinersPerSession - 1))} title="Decrease examiner count">
                      <i className="fas fa-minus" />
                    </button>
                    <input
                      type="number"
                      id="examinersCount"
                      className="number-input"
                      min="1"
                      step="1"
                      value={examinersPerSession}
                      onChange={(e) => setExaminersPerSession(Number(e.target.value) || 1)}
                    />
                    <button className="number-btn" onClick={() => setExaminersPerSession(examinersPerSession + 1)} title="Increase examiner count">
                      <i className="fas fa-plus" />
                    </button>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">examiners</span>
                  </div>
                  <p className="helper-text">Recommended: 2 examiners for balanced assessment</p>
                </div>
              </div>

              {/* Session summary */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg" style={{ height: '185px' }}>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Session Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Session duration:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{sessionLength} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Gap between sessions:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{gapTime} minutes</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total time per session:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{Number(sessionLength) + Number(gapTime)} minutes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={nextStep} className="btn btn-primary">
                <span>Next</span>
                <i className="fas fa-arrow-right ml-2" />
              </button>
            </div>
          </div>
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

              {/* Period form */}
              <div className="card-section">
                <div className="card-section-header">
                  <div className="card-section-icon icon-blue">
                    <i className="fas fa-plus-circle" />
                  </div>
                  <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {editingIndex !== null ? 'Edit Time Slot' : 'Add New Time Slot'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="form-field">
                    <label htmlFor="timeSlotStartDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <input
                      type="date"
                      id="timeSlotStartDate"
                      className="custom-input"
                      value={timeSlotStartDate}
                      onChange={(e) => setTimeSlotStartDate(e.target.value)}
                    />
                  </div>

                  {/* Start Time */}
                  <div className="form-field">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                    <div className="time-picker">
                      <select
                        className="custom-input"
                        value={timeSlotStartTimeHour}
                        onChange={(e) => setTimeSlotStartTimeHour(e.target.value)}
                        title="Select hour"
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                      <span className="time-separator">:</span>
                      <select
                        className="custom-input"
                        value={timeSlotStartTimeMinute}
                        onChange={(e) => setTimeSlotStartTimeMinute(e.target.value)}
                        title="Select minute"
                      >
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(minute => (
                          <option key={minute} value={minute}>{minute}</option>
                        ))}
                      </select>
                      <div className="flex space-x-1">
                        <span
                          className={`am-pm-toggle ${timeSlotStartTimeAMPM === 'AM' ? 'selected' : ''}`}
                          onClick={() => setTimeSlotStartTimeAMPM('AM')}
                        >
                          AM
                        </span>
                        <span
                          className={`am-pm-toggle ${timeSlotStartTimeAMPM === 'PM' ? 'selected' : ''}`}
                          onClick={() => setTimeSlotStartTimeAMPM('PM')}
                        >
                          PM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Session Count */}
                  <div className="form-field">
                    <label htmlFor="sessionCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Number of Sessions</label>
                    <div className="number-input-container">
                      <button className="number-btn" onClick={() => setSessionCount(Math.max(1, sessionCount - 1))} title="Decrease session count">
                        <i className="fas fa-minus" />
                      </button>
                      <input
                        type="number"
                        id="sessionCount"
                        className="number-input"
                        min="1"
                        value={sessionCount}
                        onChange={(e) => setSessionCount(Number(e.target.value) || 1)}
                      />
                      <button className="number-btn" onClick={() => setSessionCount(sessionCount + 1)} title="Increase session count">
                        <i className="fas fa-plus" />
                      </button>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">sessions</span>
                    </div>
                  </div>

                  {/* End Time (calculated) */}
                  <div className="form-field">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Time (calculated)</label>
                    <div className="time-display">{calculateEndTime()}</div>
                    <p className="helper-text">Based on session length and gap time</p>
                  </div>

                  {/* Venue */}
                  <div className="form-field md:col-span-2">
                    <label htmlFor="timeSlotVenue" className="text-sm font-medium text-gray-700 dark:text-gray-300">Venue</label>
                    <input
                      type="text"
                      id="timeSlotVenue"
                      className="custom-input"
                      placeholder="e.g. Room 405, Engineering Building"
                      value={timeSlotVenue}
                      onChange={(e) => setTimeSlotVenue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-3">
                  {editingIndex !== null && (
                    <button
                      onClick={() => {
                        setEditingIndex(null);
                        setTimeSlotStartDate('');
                        setTimeSlotStartTimeHour('9');
                        setTimeSlotStartTimeMinute('00');
                        setTimeSlotStartTimeAMPM('AM');
                        setSessionCount(9);
                        setTimeSlotVenue('');
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                  <button onClick={addTimeSlot} className="btn btn-primary" title="Add or update time slot">
                    <i className="fas fa-plus mr-1.5" />
                    <span>{editingIndex !== null ? 'Update Time Slot' : 'Add Time Slot'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Periods List */}
            <div className="dashboard-card p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Assessment Time Slots</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{timeSlots.length} time slots added</span>
              </div>

              {timeSlots.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-calendar-plus text-gray-400 dark:text-gray-500 text-xl" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-3">No assessment time slots have been added yet</p>
                  <button onClick={() => document.getElementById('timeSlotStartDate')?.focus()} className="btn btn-outline">
                    <i className="fas fa-plus mr-1.5" /> Add Your First Time Slot
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeSlots.map((timeSlot, index) => (
                    <div key={index} className="time-slot-card">
                      <div className="time-slot-header">
                        <div className="flex items-center">
                          <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">{timeSlot.startDate}</span>
                        </div>
                        <div className="time-slot-actions">
                          <button onClick={() => editTimeSlot(index)} className="time-slot-action-btn action-edit" title="Edit Time Slot">
                            <i className="fas fa-edit" />
                          </button>
                          <button onClick={() => duplicateTimeSlot(index)} className="time-slot-action-btn action-duplicate" title="Duplicate Time Slot">
                            <i className="fas fa-copy" />
                          </button>
                          <button onClick={() => deleteTimeSlot(index)} className="time-slot-action-btn action-delete" title="Delete Time Slot">
                            <i className="fas fa-trash-alt" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Time</span>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            <i className="fas fa-clock text-gray-400 mr-1" />
                            <span>{timeSlot.startTime} - {timeSlot.endTime}</span>
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Sessions</span>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            <i className="fas fa-users text-gray-400 mr-1" />
                            <span>{timeSlot.sessionCount} sessions</span>
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Venue</span>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            <i className="fas fa-map-marker-alt text-gray-400 mr-1" />
                            <span>{timeSlot.venue}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                    <i className="fas fa-calendar-check text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getTotalSessions()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                    <i className="fas fa-user-check text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Sessions</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getTotalAssignedSessions()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                    <i className="fas fa-users text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Available Examiners</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{examiners.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <button onClick={prevStep} className="btn btn-secondary">
                <i className="fas fa-arrow-left mr-2" />
                <span>Previous</span>
              </button>

              <button onClick={nextStep} className="btn btn-primary" disabled={timeSlots.length === 0}>
                <i className="fas fa-check mr-1.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Examine Session Assignments */}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            <div className="dashboard-card p-5 mb-6">
              <div className="flex items-center mb-5">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mr-3">
                  <i className="fas fa-users text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Max Session Assignment for Examiners</h2>
              </div>

              {/* Summary Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                    <i className="fas fa-calendar-check text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions to Assign</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getTotalSessions()} sessions</p>
                  </div>
                </div>
              </div>

              {/* Examine session assignments */}
              <div className="space-y-3">
                {examiners.map((examiner) => (
                  <div key={examiner.id} className="card-section">
                    <div className="card-section-header">
                      <div className="card-section-icon icon-blue">
                        <i className="fas fa-user" />
                      </div>
                      <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">{examiner.name}</h3>
                    </div>

                    <div className="form-field">
                      <div className="number-input-container">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Max:</span>
                        <button
                          className="number-btn"
                          onClick={() => setExaminers(prev => prev.map(ex => 
                            ex.id === examiner.id ? { ...ex, maxSessions: Math.max(0, ex.maxSessions - 1) } : ex
                          ))}
                          title="Decrease max sessions"
                        >
                          <i className="fas fa-minus" />
                        </button>
                        <input
                          type="number"
                          className="number-input"
                          min="0"
                          value={examiner.maxSessions}
                          onChange={(e) => setExaminers(prev => prev.map(ex => 
                            ex.id === examiner.id ? { ...ex, maxSessions: Number(e.target.value) || 0 } : ex
                          ))}
                        />
                        <button
                          className="number-btn"
                          onClick={() => setExaminers(prev => prev.map(ex => 
                            ex.id === examiner.id ? { ...ex, maxSessions: ex.maxSessions + 1 } : ex
                          ))}
                          title="Increase max sessions"
                        >
                          <i className="fas fa-plus" />
                        </button>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">sessions</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button onClick={prevStep} className="btn btn-secondary">
                  <i className="fas fa-arrow-left mr-2" />
                  <span>Previous</span>
                </button>

                <button onClick={completeSetup} className="btn btn-success" disabled={timeSlots.length === 0}>
                  <i className="fas fa-check mr-1.5" />
                  <span>Complete Setup</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}