"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { examinerTimeslotService } from '@/services/examinerTimeslotService';
import { useExaminerAuth } from '@/hooks/useExaminerAuth';
import useScheduleFilterStore from '@/store/scheduleFilterStore';

const AssessmentsToAssign = () => {
  const router = useRouter();
  const { examinerId, isValidExaminer } = useExaminerAuth();
  const { selectedCourse } = useScheduleFilterStore();
  
  const { data: assignmentsData, isLoading, error } = useQuery({
    queryKey: ['availableAssignments', examinerId, selectedCourse],
    queryFn: () => examinerTimeslotService.getAvailableAssignments(examinerId, {
      courseId: selectedCourse || undefined,
      pageSize: 50 // Get more assignments for better filtering
    }),
    refetchInterval: 2 * 60 * 1000, // Reduced to 2 minutes from 30 seconds
    staleTime: 60 * 1000, // 1 minute stale time
    enabled: isValidExaminer
  });

  const assignments = assignmentsData?.data?.data || [];
  

  const handleSelectTimeSlots = (assignmentId) => {
    router.push(`/examiner/schedule/select?assignmentId=${assignmentId}`);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            Open
          </span>
        );
      case 'full':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
            Full
          </span>
        );
      case 'deadline_passed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            Deadline Passed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffHours = Math.ceil((date - now) / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'Deadline passed';
    if (diffHours < 1) return 'Less than 1h';
    if (diffHours < 24) return `${diffHours}h remaining`;
    if (diffHours < 48) return 'Tomorrow';
    
    return date.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilDeadline = (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date - now;
    
    if (diffMs < 0) return null;
    
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return diffHours;
  };

  if (isLoading) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
            Assessments to Assign Time Slot
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
            Assessments to Assign Time Slot
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load assignments</p>
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

  if (assignments.length === 0) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
            Assessments to Assign Time Slot
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-check text-gray-400 dark:text-gray-500 text-2xl"></i>
          </div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            All Caught Up!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            No assessments currently need examiner assignment. New assignments will appear here when they become available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
            Assessments to Assign Time Slot
          </h2>
          <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {assignments.length} available
          </span>
        </div>
        
        {/* Refresh indicator */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-sync-alt mr-1 animate-spin opacity-0" id="refresh-indicator"></i>
          <span>Auto-refresh: 30s</span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {assignments.map((assignment) => (
          <div key={assignment.assignmentId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate mr-3">
                    {assignment.assignmentName}
                  </div>
                  {getStatusBadge(assignment.status)}
                  
                  {/* Urgency indicator */}
                  {assignment.urgency === 'high' && (
                    <div className="ml-2 flex items-center">
                      <i className="fas fa-exclamation-circle text-red-500 text-sm mr-1"></i>
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Urgent</span>
                    </div>
                  )}
                  
                  {/* Show if deadline is very soon */}
                  {getTimeUntilDeadline(assignment.signupDeadline) !== null && getTimeUntilDeadline(assignment.signupDeadline) <= 6 && (
                    <div className="ml-2 flex items-center animate-pulse">
                      <i className="fas fa-clock text-orange-500 text-sm mr-1"></i>
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Deadline Soon</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
                  <span className="flex items-center">
                    <i className="fas fa-graduation-cap mr-1.5"></i>
                    {assignment.courseCode}
                  </span>
                  
                  <span className="flex items-center">
                    <i className={`fas ${assignment.assessmentType === 'GROUP' ? 'fa-users' : 'fa-user'} mr-1.5`}></i>
                    {assignment.assessmentType === 'GROUP' ? 'Group Assessment' : 'Individual Assessment'}
                  </span>
                  
                  <span className="flex items-center">
                    <i className="fas fa-clock mr-1.5"></i>
                    {assignment.sessionDurationMinutes}min sessions
                  </span>
                  
                  <span className="flex items-center">
                    <i className="fas fa-calendar-alt mr-1.5"></i>
                    {new Date(assignment.earliestTimeslot).toLocaleDateString('en-AU', { 
                      month: 'short', 
                      day: 'numeric' 
                    })} - {new Date(assignment.latestTimeslot).toLocaleDateString('en-AU', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  
                  <span className="flex items-center">
                    <i className="fas fa-user-friends mr-1.5"></i>
                    {assignment.requiredExaminers} examiner{assignment.requiredExaminers > 1 ? 's' : ''} required
                  </span>
                </div>
                
                {/* Assignment details and capacity */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-400">Available slots:</span>
                    <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                      {assignment.availableTimeslots}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-400">Your capacity:</span>
                    <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                      {assignment.examinerInfo.remainingCapacity}/{assignment.examinerInfo.maxSessions} remaining
                    </span>
                  </div>
                  
                  {assignment.signupDeadline && (
                    <div className="flex items-center">
                      <i className="fas fa-calendar-times text-gray-400 mr-1"></i>
                      <span className="text-gray-600 dark:text-gray-400">Signup by:</span>
                      <span className={`ml-1 font-medium ${getUrgencyColor(assignment.urgency)}`}>
                        {formatDeadline(assignment.signupDeadline)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Progress bar for capacity */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Session Allocation</span>
                    <span>{assignment.examinerInfo.currentAssignedSessions}/{assignment.examinerInfo.maxSessions}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(assignment.examinerInfo.currentAssignedSessions / assignment.examinerInfo.maxSessions) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Action button */}
              <div className="ml-4 flex-shrink-0">
                {assignment.status === 'open' ? (
                  assignment.examinerInfo.remainingCapacity === 0 ? (
                    <div className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm flex items-center">
                      <i className="fas fa-exclamation-triangle mr-1.5"></i>
                      At Capacity
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectTimeSlots(assignment.assignmentId)}
                      className={`px-3 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm ${
                        assignment.urgency === 'high' 
                          ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <i className="fas fa-plus mr-1.5"></i>
                      Select Time Slots
                      {assignment.urgency === 'high' && (
                        <i className="fas fa-exclamation-circle ml-1.5 text-xs"></i>
                      )}
                    </button>
                  )
                ) : assignment.status === 'full' ? (
                  <div className="px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm flex items-center">
                    <i className="fas fa-check-circle mr-1.5"></i>
                    Fully Staffed
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm flex items-center">
                    <i className="fas fa-clock mr-1.5"></i>
                    Deadline Passed
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer with summary */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            Showing {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
            {selectedCourse && ` for ${selectedCourse}`}
            • Updates automatically every 30 seconds
          </span>
          <div className="flex items-center">
            <i className="fas fa-info-circle mr-1"></i>
            Click "Select Time Slots" to choose your examination times
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsToAssign;
