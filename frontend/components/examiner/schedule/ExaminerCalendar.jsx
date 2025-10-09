"use client";
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { examinerTimeslotService } from '@/services/examinerTimeslotService';
import { useExaminerAuth } from '@/hooks/useExaminerAuth';
import { useNotification } from '@/hooks/useNotification';
import { useTimeslotAssignment } from '@/hooks/useTimeslotAssignment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import OperationResultDialog from "@/components/examiner/schedule/OperationResultDialog";
import { formatVenue } from '@/utils/formatVenue';
import { toLocalDateKey } from '@/utils/dateUtils';
import useScheduleFilterStore from '@/store/scheduleFilterStore';

const ExaminerCalendar = () => {
  const router = useRouter();
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const { selectedCourse, searchText, assessmentType } = useScheduleFilterStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { showNotification } = useNotification();
  
  const { withdrawFromSession, isSubmitting, canWithdraw } = useTimeslotAssignment();
  const [resultOpen, setResultOpen] = useState(false);
  const [resultProps, setResultProps] = useState({});

  const { data: scheduleData, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['examinerSchedule', examinerId, currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: () => {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      return examinerTimeslotService.getExaminerSchedule(examinerId, {
        dateFrom: toLocalDateKey(monthStart),
        dateTo: toLocalDateKey(monthEnd)
      });
    },
    enabled: isValidExaminer,
    refetchInterval: 2 * 60 * 1000, // Reduced to 2 minutes from 30 seconds
    staleTime: 60 * 1000 // 1 minute stale time
  });

  const scheduleSessionsRaw = useMemo(() => (
    (scheduleData?.data?.assignments ?? []).flatMap((assignment) =>
      (assignment.sessions || assignment.slots || []).map((slot) => {
        const required = slot.requiredExaminers ?? slot.coverage?.required ?? null;
        const normalizedType = (slot.assessmentType
          || ((required === 1)
            ? 'INDIVIDUAL'
            : (required === 0 || required == null ? 'MIX' : 'GROUP')))
          .toString()
          .toUpperCase();
        return {
          ...slot,
          assignmentId: assignment.assignmentId,
          assignmentName: assignment.assignmentName,
          courseCode: assignment.courseCode,
          courseName: assignment.courseName,
          assessmentType: normalizedType,
        };
      })
    )
  ), [scheduleData]);

  const scheduleSlots = useMemo(() => {
    let filtered = scheduleSessionsRaw;
    if (selectedCourse) filtered = filtered.filter(s => s.courseCode === selectedCourse);
    if (assessmentType && assessmentType !== 'ALL') filtered = filtered.filter(s => s.assessmentType === assessmentType);
    if (searchText && searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      filtered = filtered.filter(s =>
        s.assignmentName.toLowerCase().includes(q) ||
        s.courseName.toLowerCase().includes(q) ||
        s.courseCode.toLowerCase().includes(q) ||
        (s.participants && s.participants.some(p => p.toLowerCase().includes(q)))
      );
    }
    return filtered;
  }, [scheduleSessionsRaw, selectedCourse, assessmentType, searchText]);
  

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's trailing days
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek; i > 0; i--) {
      const dayOfPrevMonth = prevMonthLastDate - i + 1;
      days.push({
        date: dayOfPrevMonth,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, dayOfPrevMonth)
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: new Date(year, month, day)
      });
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, day)
      });
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = toLocalDateKey(date);
    return scheduleSlots.filter(slot => toLocalDateKey(new Date(slot.start)) === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleEventClick = (event, slot) => {
    event.stopPropagation();
    setSelectedEvent(slot);
    setShowEventModal(true);
  };

  const confirmWithdraw = () => setConfirmOpen(true);

  const handleWithdraw = async () => {
    if (!selectedEvent) return;
    setIsWithdrawing(true);
    try {
      const res = await withdrawFromSession(selectedEvent, async () => {
        setConfirmOpen(false);
        setShowEventModal(false);
        await refetch();
      });
      if (res?.success) {
        const start = selectedEvent.start ? new Date(selectedEvent.start) : null;
        const end = selectedEvent.end ? new Date(selectedEvent.end) : null;
        const detail = start && end
          ? `${start.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})} – ${end.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit'})}`
          : `Timeslot #${selectedEvent.sessionId ?? selectedEvent.slotId}`;
        setResultProps({ status: 'success', title: 'Withdrawn from Session', message: 'Your schedule has been updated.', details: [detail], autoDismiss: true, autoDismissMs: 1300 });
        setResultOpen(true);
      }
    } catch (e) {
      setResultProps({ status: 'error', title: 'Withdraw Failed', message: e?.message || 'Failed to withdraw from timeslot', autoDismiss: false, primaryActionLabel: 'Close' });
      setResultOpen(true);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventStatusClass = (slot) => {
    const now = new Date();
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    
    if (now >= slotStart && now <= slotEnd) {
      return 'event-active'; // Currently active
    } else if (now > slotEnd) {
      return 'event-completed'; // Past event
    } else if (slotStart.getTime() - now.getTime() < 30 * 60 * 1000) {
      return 'event-soon'; // Starting soon
    }
    return 'event-upcoming';
  };

  const getEventColor = (slot) => {
    const type = (slot.assessmentType || '').toString().toUpperCase();
    if (type === 'GROUP') {
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100 border-blue-300 dark:border-blue-500';
    }
    if (type === 'MIX' || type === 'MIXED') {
      return 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-100 border-teal-300 dark:border-teal-500';
    }
    return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-100 border-indigo-300 dark:border-indigo-500';
  };

  const days = getDaysInMonth(currentMonth);
  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return '';
    const diff = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60), s = diff % 60;
    return `${m}m ${s}s ago`;
  }, [dataUpdatedAt]);

  if (isLoading) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400 mr-2"></i>
            Calendar
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400 mr-2"></i>
            Calendar
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load calendar</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400 mr-2"></i>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            {scheduleSlots.length > 0 && (
              <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {scheduleSlots.length} event{scheduleSlots.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="text-gray-500 dark:text-gray-400">Updated {lastUpdatedLabel}</div>
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous month"
            >
              <i className="fas fa-chevron-left text-gray-500 dark:text-gray-400"></i>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next month"
            >
              <i className="fas fa-chevron-right text-gray-500 dark:text-gray-400"></i>
            </button>
          </div>
        </div>
        <div className="p-4 overflow-x-auto">

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 text-center">
            {/* Day headers */}
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="calendar-header">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              const events = getEventsForDate(day.fullDate);
              const isCurrentDay = isToday(day.fullDate);
              const displayDateLabel = day.isCurrentMonth
                ? day.date
                : day.fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const ariaLabel = day.fullDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });
              
              return (
                <div
                  key={day.fullDate.toISOString() + index}
                  className={`calendar-day ${isCurrentDay ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''}`}
                  aria-label={ariaLabel}
                >
                  <div className="calendar-day-header">
                    <span className={`date-number ${isCurrentDay ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}>
                      {displayDateLabel}
                    </span>
                    {isCurrentDay && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 text-blue-800 dark:text-blue-200 rounded">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Events for this day */}
                  {events.slice(0, 3).map((slot, eventIndex) => {
                    const eventColor = getEventColor(slot);
                    const statusClass = getEventStatusClass(slot);
                    
                    return (
                      <div
                        key={`${slot.slotId}-${eventIndex}`}
                        className={`event-item cursor-pointer hover:opacity-80 transition-all duration-200 mb-1 p-1 rounded text-xs border ${eventColor} ${isCurrentDay ? 'font-medium ring-2 ring-blue-300' : ''}`}
                        onClick={(e) => handleEventClick(e, slot)}
                        title={`${slot.assignmentName} - ${slot.courseCode}\n${formatTime(slot.start)} - ${formatTime(slot.end)}\n${slot.participants?.length ? slot.participants[0] : 'No bookings'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{slot.courseCode}</span>
                          {statusClass === 'event-active' && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="text-xs opacity-75 truncate">
                          {formatTime(slot.start)}
                        </div>
                        {slot.participants?.length > 0 && (
                          <div className="text-xs opacity-60 truncate">
                            {slot.participants[0]}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Show "more" indicator if there are additional events */}
                  {events.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Group assessment</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Individual assessment</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-teal-100 dark:bg-teal-900/40 border border-teal-300 dark:border-teal-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Mixed assessment</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 border-2 border-blue-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Today</span>
              </div>
            </div>
            {scheduleSlots.length === 0 && (
              <div className="text-center mt-2 text-gray-500 dark:text-gray-400">
                <i className="fas fa-calendar-times mr-2"></i>
                No scheduled assessments this month
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowEventModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {selectedEvent.assignmentName}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Course</span>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedEvent.courseName} ({selectedEvent.courseCode})
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 mr-3">
                    <i className="fas fa-users"></i>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Participants</span>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedEvent.participants?.[0] || 'TBA'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400 mr-3">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
                  <div className="font-medium text-gray-800 dark:text-gray-200">{formatVenue(selectedEvent.venue)}</div>
                  </div>
                </div>

                {/* Status indicators */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Status:</span>
                    {selectedEvent.isBooked ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <i className="fas fa-check-circle mr-1"></i>
                        Booked
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                        <i className="fas fa-clock mr-1"></i>
                        Awaiting Students
                      </span>
                    )}
                  </div>
                  
                  {canWithdraw(selectedEvent) ? (
                    <button onClick={confirmWithdraw} className="text-xs text-red-600 dark:text-red-400 hover:underline" disabled={isSubmitting}>
                      <i className="fas fa-times-circle mr-1"></i>
                      Withdraw
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Withdrawal not allowed</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                {selectedEvent.isBooked && (
                  <button
                    onClick={() => {
                      // Navigate to assessment session page: /examiner/assessment/{assignmentId}/{sessionId}
                      const assignmentId = selectedEvent.assignmentId;
                      const sessionId = selectedEvent.sessionId || selectedEvent.slotId;
                      setShowEventModal(false);
                      router.push(`/examiner/assessment/${assignmentId}/${sessionId}`);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                  >
                    Start Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Withdrawal</DialogTitle>
            <DialogDescription>
              You are about to withdraw from <strong>{selectedEvent?.assignmentName}</strong> ({selectedEvent?.courseCode}).
              This may impact scheduling. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button className="px-3 py-2 border rounded-md text-sm" onClick={() => setConfirmOpen(false)} disabled={isWithdrawing}>Cancel</button>
            <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm disabled:opacity-50" onClick={handleWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? 'Withdrawing…' : 'Confirm Withdraw'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <OperationResultDialog open={resultOpen} onOpenChange={setResultOpen} {...resultProps} />
    </>
  );
};

export default ExaminerCalendar;
