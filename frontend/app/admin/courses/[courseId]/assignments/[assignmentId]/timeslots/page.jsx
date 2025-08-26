'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AddTimeSlotModal from '../../../../../../../components/admin/schedule/AddTimeSlotModal';

const EXAMINERS = [
  { id: 1, name: 'Dr. Emma Thompson', avatar: '/api/placeholder/24/24', assignments: 4 },
  { id: 2, name: 'Dr. Michael Chen', avatar: '/api/placeholder/24/24', assignments: 2 },
  { id: 3, name: 'Dr. Sarah Johnson', avatar: '/api/placeholder/24/24', assignments: 1 },
  { id: 4, name: 'Prof. David Williams', avatar: '/api/placeholder/24/24', assignments: 3 },
  { id: 5, name: 'Dr. Jennifer Lee', avatar: '/api/placeholder/24/24', assignments: 0 },
  { id: 6, name: 'Prof. Robert Brown', avatar: '/api/placeholder/24/24', assignments: 2 },
];

function determineStatus(assignedCount, requiredCount) {
  if (assignedCount === 0) return 'empty';
  if (assignedCount < requiredCount) return 'partial';
  return 'full';
}

function StatusPill({ status, assigned, required }) {
  const classes =
    status === 'full'
      ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-800 dark:text-green-200'
      : status === 'partial'
      ? 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 text-yellow-800 dark:text-yellow-200'
      : 'bg-red-100 dark:bg-red-900 dark:bg-opacity-30 text-red-800 dark:text-red-200';
  return (
    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${classes}`}>
      {assigned}/{required} examiners
    </span>
  );
}

function to24Hour(timeStr) {
  if (!timeStr) return '';
  const [time, period] = timeStr.split(' ');
  let [hour, minute] = time.split(':');
  let h = parseInt(hour, 10);
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

export default function AssignmentTimeSlotsPage() {
  const params = useParams();
  const { courseId, assignmentId } = params;
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [timeSlots, setTimeSlots] = useState([
    {
      id: 1,
      date: '2025-04-15',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      venue: 'Engineering Building, Room 405',
      requiredExaminers: 2,
      assignedExaminers: [EXAMINERS[0], EXAMINERS[1]],
      sessions: 3,
      status: 'full',
    },
    {
      id: 2,
      date: '2025-04-15',
      startTime: '11:00 AM',
      endTime: '12:30 PM',
      venue: 'Engineering Building, Room 405',
      requiredExaminers: 2,
      assignedExaminers: [EXAMINERS[0]],
      sessions: 3,
      status: 'partial',
    },
    {
      id: 3,
      date: '2025-04-16',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      venue: 'ICT Building, Room 203',
      requiredExaminers: 2,
      assignedExaminers: [],
      sessions: 4,
      status: 'empty',
    },
    {
      id: 4,
      date: '2025-04-18',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      venue: 'Engineering Building, Room 303',
      requiredExaminers: 2,
      assignedExaminers: [EXAMINERS[2], EXAMINERS[3]],
      sessions: 3,
      status: 'full',
    },
  ]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

  const currentMonth = 'August 2025';

  const timeSlotsForSelectedDate = useMemo(
    () => (selectedDate ? timeSlots.filter((s) => s.date === selectedDate) : []),
    [selectedDate, timeSlots]
  );

  const getStatusForDate = (date) => {
    const slots = timeSlots.filter((s) => s.date === date);
    if (!slots.length) return null;
    const statuses = slots.map((s) => s.status);
    if (statuses.every((st) => st === 'full')) return 'full';
    if (statuses.every((st) => st === 'empty')) return 'empty';
    return 'partial';
  };

  const toggleTimeSlotSelection = (id) => {
    setSelectedTimeSlots((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllTimeSlotsForDate = () => {
    if (!selectedDate) return;
    const dateSlots = timeSlots.filter((s) => s.date === selectedDate).map((s) => s.id);
    const allSelected = dateSlots.every((id) => selectedTimeSlots.includes(id));
    setSelectedTimeSlots((prev) => (allSelected ? prev.filter((id) => !dateSlots.includes(id)) : [...new Set([...prev, ...dateSlots])]))
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setShowModal(true);
  };
  const openEditModal = (index) => {
    setEditingIndex(index);
    setShowModal(true);
  };

  const deleteTimeSlot = (id) => {
    if (confirm('Delete this time slot?')) {
      setTimeSlots((prev) => prev.filter((s) => s.id !== id));
      setSelectedTimeSlots((prev) => prev.filter((sid) => sid !== id));
    }
  };

  const deleteSelectedTimeSlots = () => {
    if (selectedTimeSlots.length === 0) return;
    if (confirm(`Delete ${selectedTimeSlots.length} selected time slots?`)) {
      setTimeSlots((prev) => prev.filter((s) => !selectedTimeSlots.includes(s.id)));
      setSelectedTimeSlots([]);
    }
  };

  const duplicateTimeSlot = (id) => {
    setTimeSlots((prev) => {
      const original = prev.find((s) => s.id === id);
      if (!original) return prev;
      const newId = Math.max(...prev.map((s) => s.id)) + 1;
      return [...prev, { ...original, id: newId, assignedExaminers: [] }];
    });
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
          <button className="add-time-slot-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2" onClick={openAddModal}>
            <span className="text-lg">+</span>
            <span>Add New Time Slot</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium" onClick={() => alert('Schedule released!')}>
            Release Schedule
          </button>
        </div>
      </div>

      {/* Project Info Card */}
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
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">30 minutes per session</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">GAP TIME</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">5 minutes between sessions</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">EXAMINERS REQUIRED</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">2 examiners per session</div>
          </div>
        </div>
      </div>

      {/* Calendar + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400 mr-2" /> {currentMonth}
            </h2>
            <div className="flex items-center space-x-2">
              <button className="calendar-nav-btn text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="calendar-nav-btn text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          {/* Calendar header */}
          <div className="calendar-container mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="text-xs text-center font-medium text-gray-500 dark:text-gray-400 p-2">{d}</div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="calendar-container">
            {/* Previous month days */}
            <div className="calendar-day text-gray-300 dark:text-gray-600">
              <span className="date">30</span>
            </div>
            <div className="calendar-day text-gray-300 dark:text-gray-600">
              <span className="date">31</span>
            </div>
            
            {/* Current month days */}
            {/* August 2025 calendar - matching the modal date */}
            {[...Array(31)].map((_, idx) => {
              const day = idx + 1;
              const dateStr = `2025-08-${String(day).padStart(2,'0')}`;
              const status = getStatusForDate(dateStr);
              const count = timeSlots.filter((s) => s.date === dateStr).length;
              const isToday = day === 12; // Example: 12th is today (matching modal date)
              
              return (
                <div
                  key={dateStr}
                  className={`calendar-day ${selectedDate === dateStr ? 'selected' : ''} ${isToday ? 'border-2 border-blue-400' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                  role="button"
                  aria-label={`Select ${dateStr}`}
                >
                  <span className="date">{day}</span>
                  {status && (
                    <div className="day-status">
                      <span className="slot-count">{count}</span>
                      <div className={`status-indicator ${status === 'full' ? 'status-full' : status === 'partial' ? 'status-partial' : 'status-empty'}`} />
                    </div>
                  )}
                  {isToday && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Legend</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="legend-item">
                <div className="legend-dot bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Fully Staffed</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot bg-yellow-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Partially Staffed</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Unstaffed</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - list for selected date */}
        <div className="dashboard-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2" />
              {selectedDate ? `Time Slots - ${selectedDate}` : 'Time Slots - Select a date'}
            </h2>
            {selectedDate && timeSlotsForSelectedDate.length > 0 && (
              <button onClick={selectAllTimeSlotsForDate} className="px-3 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                {timeSlotsForSelectedDate.every((s) => selectedTimeSlots.includes(s.id)) ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {!selectedDate && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fas fa-calendar-day text-xl" />
              </div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">No Date Selected</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">Select a date from the calendar to view and manage time slots for that day.</p>
            </div>
          )}

          {selectedDate && timeSlotsForSelectedDate.length === 0 && (
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

          {selectedDate && timeSlotsForSelectedDate.length > 0 && (
            <div className="space-y-4">
              {/* Batch bar */}
              {selectedTimeSlots.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg flex items-center justify-between animate-fade-in">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200 mr-2">
                    <i className="fas fa-check-square mr-1.5" /> {selectedTimeSlots.length} time slots selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <button className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => alert('Emails sent!')}>
                      <i className="fas fa-envelope mr-1.5" /> Notify Examiners
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => selectedTimeSlots.forEach(duplicateTimeSlot)}>
                      <i className="fas fa-copy mr-1.5" /> Duplicate
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700" onClick={deleteSelectedTimeSlots}>
                      <i className="fas fa-trash-alt mr-1.5" /> Delete
                    </button>
                  </div>
                </div>
              )}

              {timeSlotsForSelectedDate.map((slot, idx) => (
                <div key={slot.id} className="time-slot-item">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <input
                          type="checkbox"
                          checked={selectedTimeSlots.includes(slot.id)}
                          onChange={() => toggleTimeSlotSelection(slot.id)}
                          className="rounded text-blue-600"
                          aria-label="Select time slot"
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                          {to24Hour(slot.startTime)} - {to24Hour(slot.endTime)}
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          <i className="fas fa-map-marker-alt mr-1.5" /> {slot.venue}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="mr-3 text-right">
                        <StatusPill status={slot.status} assigned={slot.assignedExaminers.length} required={slot.requiredExaminers} />
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <i className="fas fa-users mr-1.5" /> {slot.sessions} sessions
                        </div>
                      </div>
                      <div className="flex">
                        <button className="action-btn action-btn-primary mr-1" title="Edit Time Slot" onClick={() => openEditModal(timeSlots.findIndex((s) => s.id === slot.id))}>
                          <i className="fas fa-edit" />
                        </button>
                        <button className="action-btn text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:bg-amber-900 dark:bg-opacity-20 dark:hover:bg-opacity-30 mr-1" title="Duplicate Time Slot" onClick={() => duplicateTimeSlot(slot.id)}>
                          <i className="fas fa-copy" />
                        </button>
                        <button className="action-btn text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:bg-red-900 dark:bg-opacity-20 dark:hover:bg-opacity-30 mr-1" title="Delete Time Slot" onClick={() => deleteTimeSlot(slot.id)}>
                          <i className="fas fa-trash-alt" />
                        </button>
                        <button className="action-btn text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:bg-purple-900 dark:bg-opacity-20 dark:hover:bg-opacity-30" title="Notify Examiners" onClick={() => alert('Emails sent!')}>
                          <i className="fas fa-envelope" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-row">
                    <div className="flex-1 pr-6">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Examiner Allocated:</h4>
                      {slot.assignedExaminers.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">No examiners assigned yet</div>
                      ) : (
                        <div className="flex flex-wrap">
                          {slot.assignedExaminers.map((ex) => (
                            <div key={ex.id} className="examiner-chip pr-2">{ex.name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-l border-gray-200 dark:border-gray-700 pl-6 flex flex-col items-start min-w-[180px]">
                      <div className="flex items-center w-full justify-between">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">0/{slot.sessions} session booked</div>
                        <button className="ml-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs text-blue-600 dark:text-blue-400">
                          <i className="fas fa-chevron-down" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AddTimeSlotModal
        isOpen={showModal}
        mode={editingIndex !== null ? 'edit' : 'add'}
        initialData={editingIndex !== null ? timeSlots[editingIndex] : undefined}
        availableExaminers={EXAMINERS}
        onCancel={() => {
          setShowModal(false);
          setEditingIndex(null);
        }}
        onSave={(data) => {
          console.log('Saving time slot data:', data); // Debug log
          
          // Convert date format from YYYY/MM/DD to YYYY-MM-DD if needed
          const normalizedDate = data.date.replace(/\//g, '-');
          const normalizedData = { ...data, date: normalizedDate };
          
          setTimeSlots((prev) => {
            if (editingIndex !== null) {
              const copied = [...prev];
              copied[editingIndex] = { ...normalizedData, id: prev[editingIndex].id };
              copied[editingIndex].status = determineStatus(
                copied[editingIndex].assignedExaminers.length,
                copied[editingIndex].requiredExaminers
              );
              return copied;
            }
            const newId = prev.length ? Math.max(...prev.map((s) => s.id)) + 1 : 1;
            const newSlot = {
              ...normalizedData,
              id: newId,
              status: determineStatus(normalizedData.assignedExaminers.length, normalizedData.requiredExaminers),
            };
            console.log('Adding new slot:', newSlot); // Debug log
            return [...prev, newSlot];
          });
          
          setShowModal(false);
          setEditingIndex(null);
          
          // Auto-select the date if not already selected
          if (!selectedDate && normalizedData.date) {
            setSelectedDate(normalizedData.date);
          }
          
          // Show success message
          alert('Time slot added successfully!');
        }}
      />
    </div>
  );
}