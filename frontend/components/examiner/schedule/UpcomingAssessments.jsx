"use client";
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { examinerTimeslotService } from '@/services/examinerTimeslotService';
import { useExaminerAuth } from '@/hooks/useExaminerAuth';
import useScheduleFilterStore from '@/store/scheduleFilterStore';

const UpcomingAssessments = () => {
  const router = useRouter();
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const { selectedCourse, searchText, assessmentType } = useScheduleFilterStore();
  
  const { data: scheduleData, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['examinerUpcoming', examinerId],
    queryFn: () => {
      const today = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(today.getDate() + 14);
      
      return examinerTimeslotService.getExaminerSchedule(examinerId, {
        dateFrom: today.toISOString().split('T')[0],
        dateTo: twoWeeksFromNow.toISOString().split('T')[0]
      });
    },
    refetchInterval: 3 * 60 * 1000, // Reduced to 3 minutes from 30 seconds
    staleTime: 90 * 1000, // 90 seconds stale time
    enabled: isValidExaminer
  });

  const allSlotsRaw = useMemo(() => scheduleData?.data?.assignments?.flatMap(assignment => 
    (assignment.sessions || assignment.slots || []).map(slot => ({
      ...slot,
      assignmentId: assignment.assignmentId,
      assignmentName: assignment.assignmentName,
      courseCode: assignment.courseCode,
      courseName: assignment.courseName,
      assessmentType: (slot.requiredExaminers === 1) ? 'INDIVIDUAL' : 'GROUP'
    }))
  ) || [], [scheduleData]);

  const allSlots = useMemo(() => {
    let filtered = allSlotsRaw;
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
  }, [allSlotsRaw, selectedCourse, assessmentType, searchText]);
  

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // Group slots by time periods
  const groupedSlots = {
    today: allSlots.filter(slot => {
      const slotDate = new Date(slot.start);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() === today.getTime();
    }).sort((a, b) => new Date(a.start) - new Date(b.start)),

    tomorrow: allSlots.filter(slot => {
      const slotDate = new Date(slot.start);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() === tomorrow.getTime();
    }).sort((a, b) => new Date(a.start) - new Date(b.start)),

    nextWeek: allSlots.filter(slot => {
      const slotDate = new Date(slot.start);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() > tomorrow.getTime() && slotDate.getTime() <= nextWeek.getTime();
    }).sort((a, b) => new Date(a.start) - new Date(b.start))
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getSlotStatus = (slot) => {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    const timeDiff = slotStart.getTime() - now.getTime();
    
    if (now >= slotStart && now <= slotEnd) {
      return 'active';
    } else if (now > slotEnd) {
      return 'completed';
    } else if (timeDiff < 30 * 60 * 1000 && timeDiff > 0) { // 30 minutes before
      return 'starting-soon';
    } else if (timeDiff < 2 * 60 * 60 * 1000 && timeDiff > 0) { // 2 hours before
      return 'soon';
    }
    return 'upcoming';
  };

  const getTimeUntilStart = (slot) => {
    const slotStart = new Date(slot.start);
    const diffMs = slotStart.getTime() - now.getTime();
    
    if (diffMs < 0) return null;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `${diffHours}h ${diffMinutes % 60}min`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300';
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300';
      case 'starting-soon':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 animate-pulse';
      case 'soon':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300';
    }
  };

  const getStatusText = (status, slot) => {
    const timeUntil = getTimeUntilStart(slot);
    
    switch (status) {
      case 'active':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'starting-soon':
        return `Starting in ${timeUntil}`;
      case 'soon':
        return `In ${timeUntil}`;
      default:
        return timeUntil ? `In ${timeUntil}` : 'Upcoming';
    }
  };

  const getActionButton = (slot, status) => {
    const currentTime = new Date();
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    
    if (status === 'active') {
      return (
        <button
          onClick={() => router.push(`/examiner/assessment?slotId=${slot.slotId}`)}
          className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
        >
          <i className="fas fa-play mr-1.5"></i>
          Continue
        </button>
      );
    } else if (status === 'starting-soon' && slot.isBooked) {
      return (
        <button
          onClick={() => router.push(`/examiner/assessment?slotId=${slot.slotId}`)}
          className="inline-flex items-center px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-colors"
        >
          <i className="fas fa-clipboard-check mr-1.5"></i>
          Start
        </button>
      );
    } else if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
          <i className="fas fa-check-circle mr-1.5"></i>
          Done
        </span>
      );
    } else if (slot.isBooked) {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
          <i className="fas fa-clock mr-1.5"></i>
          Scheduled
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium">
          <i className="fas fa-hourglass-half mr-1.5"></i>
          Waiting
        </span>
      );
    }
  };

  const renderSlotSection = (title, slots, dateLabel) => {
    if (slots.length === 0) return null;

    return (
      <div className="p-4">
        <h3 className={`text-sm font-semibold mb-3 ${
          title.includes('Today') 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-gray-700 dark:text-gray-300'
        }`}>
          {title} {dateLabel && `(${dateLabel})`}
        </h3>

        <div className="space-y-3">
          {slots.map((slot) => {
            const status = getSlotStatus(slot);
            
            return (
              <div
                key={slot.slotId}
                className={`flex items-start hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors border ${
                  status === 'active' 
                    ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                    : status === 'starting-soon'
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                    : status === 'soon'
                    ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                {/* Time column */}
                <div className="text-center min-w-[80px] mr-4">
                  <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {formatTime(slot.start)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round((new Date(slot.end) - new Date(slot.start)) / (1000 * 60))}min
                  </div>
                  {!title.includes('Today') && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(slot.start)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate mr-3">
                      {slot.assignmentName}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(status)}`}>
                      {status === 'active' && (
                        <i className="fas fa-circle text-green-500 mr-1 animate-pulse" style={{fontSize: '6px'}}></i>
                      )}
                      {getStatusText(status, slot)}
                    </span>
                    {status === 'starting-soon' && (
                      <i className="fas fa-exclamation-triangle text-red-500 ml-2 animate-bounce"></i>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
                    <span className="flex items-center">
                      <i className="fas fa-graduation-cap mr-1.5"></i>
                      {slot.courseCode}
                    </span>
                    
                    {slot.participants && slot.participants.length > 0 ? (
                      <span className="flex items-center">
                        <i className="fas fa-users mr-1.5"></i>
                        {slot.participants[0]}
                      </span>
                    ) : (
                      <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                        <i className="fas fa-exclamation-triangle mr-1.5"></i>
                        No students booked
                      </span>
                    )}
                    
                    <span className="flex items-center">
                      <i className="fas fa-map-marker-alt mr-1.5"></i>
                      {slot.venue.name} {slot.venue.room}
                    </span>
                  </div>
                  
                  {/* Additional info */}
                  <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center mr-4">
                      <i className="fas fa-user-friends mr-1"></i>
                      {slot.currentExaminers}/{slot.requiredExaminers} examiners
                    </span>
                    {slot.isBooked && (
                      <span className="flex items-center">
                        <i className="fas fa-check-circle mr-1"></i>
                        {slot.bookingCount} booking{slot.bookingCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="ml-4 flex-shrink-0">
                  {getActionButton(slot, status)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2"></i>
            Upcoming Assessments
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading upcoming assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2"></i>
            Upcoming Assessments
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load upcoming assessments</p>
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

  const totalUpcoming = groupedSlots.today.length + groupedSlots.tomorrow.length + groupedSlots.nextWeek.length;

  return (
    <div className="dashboard-card mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2"></i>
            Upcoming Assessments
          </h2>
          {totalUpcoming > 0 && (
            <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {totalUpcoming} scheduled
            </span>
          )}
        </div>
        
        {/* Live indicator and urgent notifications */}
        <div className="flex items-center space-x-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Updated {(() => { const diff = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt)/1000) : null; if (diff == null) return '—'; if (diff < 1) return 'just now'; if (diff < 60) return `${diff}s ago`; const m=Math.floor(diff/60), s=diff%60; return `${m}m ${s}s ago`; })()}</div>
          {groupedSlots.today.some(slot => getSlotStatus(slot) === 'active') && (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live timeslot
            </div>
          )}
          {allSlots.some(slot => getSlotStatus(slot) === 'starting-soon') && (
            <div className="flex items-center text-xs text-red-600 dark:text-red-400">
              <i className="fas fa-exclamation-triangle mr-1 animate-bounce"></i>
              Starting soon
            </div>
          )}
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-sync-alt mr-1"></i>
            Auto-refresh: 30s
          </div>
        </div>
      </div>

      {totalUpcoming === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-check text-gray-400 dark:text-gray-500 text-2xl"></i>
          </div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            No Upcoming Assessments
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            You have no scheduled assessment timeslots in the next two weeks. Check back later or review available assignments.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {renderSlotSection(
            `Today (${today.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })})`,
            groupedSlots.today
          )}
          
          {renderSlotSection(
            `Tomorrow (${tomorrow.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' })})`,
            groupedSlots.tomorrow
          )}
          
          {renderSlotSection(
            'Next Week',
            groupedSlots.nextWeek
          )}
        </div>
      )}

      {/* Footer info */}
      {totalUpcoming > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>
              {groupedSlots.today.length} today • {groupedSlots.tomorrow.length} tomorrow • {groupedSlots.nextWeek.length} next week
              {groupedSlots.today.some(slot => getSlotStatus(slot) === 'active') && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  • <i className="fas fa-circle animate-pulse" style={{fontSize: '6px'}}></i> Live timeslot
                </span>
              )}
            </span>
            <div className="flex items-center">
              <i className="fas fa-sync-alt mr-1"></i>
              Updates every 30 seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingAssessments;
