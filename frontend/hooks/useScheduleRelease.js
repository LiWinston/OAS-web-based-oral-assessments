/**
 * React Query hook for schedule release operations
 * Handles schedule status validation and release functionality
 */

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseAdminTimeslotService } from '@/services/courseAdminTimeslotService.js';
import { showSuccess, showError, showWarning } from '@/lib/notifications.js';

/**
 * Query key factory for schedule release
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} Query key factories
 */
export const scheduleReleaseKeys = {
  all: ['assignment'],
  assignment: (assignmentId) => ['assignment', assignmentId, 'schedule'],
  status: (assignmentId) => ['assignment', assignmentId, 'schedule', 'status']
};

/**
 * Hook for schedule release operations
 * @param {string} assignmentId - Assignment ID
 * @param {Object} options - Additional query options
 * @returns {Object} Schedule release query and mutation functions
 */
export function useScheduleRelease(assignmentId, options = {}) {
  const queryClient = useQueryClient();
  const STORAGE_KEY = assignmentId ? `oas_release_examiners_${assignmentId}` : null;
  const [examinerReleasedLocal, setExaminerReleasedLocal] = useState(false);
  useEffect(() => {
    if (!STORAGE_KEY) return;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setExaminerReleasedLocal(v === 'true');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

  // Query for schedule status (validation for release)
  const scheduleStatusQuery = useQuery({
    queryKey: scheduleReleaseKeys.status(assignmentId),
    queryFn: async () => {
      const response = await courseAdminTimeslotService.getScheduleStatus(assignmentId);
      return response.data;
    },
    enabled: !!assignmentId,
    staleTime: 1 * 60 * 1000, // 1 minute - status can change frequently
    ...options
  });

  // Mutation for releasing the schedule
  const releaseSchedule = useMutation({
    mutationFn: async (payload = {}) => {
      // Pre-validate before attempting release
      // const statusResponse = await courseAdminTimeslotService.getScheduleStatus(assignmentId);
      // if (!statusResponse.success) {
      //   throw new Error(statusResponse.message);
      // }

      // if (!statusResponse.data.canRelease) {
      //   throw new Error('Schedule cannot be released: ' + (statusResponse.data.issues?.join(', ') || 'Unknown validation issues'));
      // }

      const response = await courseAdminTimeslotService.releaseSchedule(assignmentId, payload);
      
      console.log("response", response);
      
      if (!response.data?.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onMutate: async () => {
      // Show immediate feedback
      showWarning('Releasing schedule, please wait...');
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries since release affects multiple data points
      queryClient.invalidateQueries({
        queryKey: scheduleReleaseKeys.assignment(assignmentId)
      });
      
      // Also invalidate time slots and calendar data since they may show different states after release
      queryClient.invalidateQueries({
        queryKey: ['assignment', assignmentId, 'timeslots']
      });
      queryClient.invalidateQueries({
        queryKey: ['assignment', assignmentId, 'calendar']
      });

      try {
        const audience = variables?.audience;
        const msg = data?.data?.message || 'Schedule released successfully';
        const notified = data?.data?.notificationsSent || {};
        if (audience === 'examiners') {
          setExaminerReleasedLocal(true);
          try { if (STORAGE_KEY) localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
          const count = notified.examiners ?? 0;
          showSuccess(`${msg}${count ? ` — notified ${count} examiners` : ''}`);
        } else if (audience === 'students') {
          const count = notified.students ?? 0;
          showSuccess(`${msg}${count ? ` — notified ${count} students` : ''}`);
        } else {
          showSuccess(msg);
        }
      } catch (e) {
        showSuccess('Schedule released successfully');
      }
    },
    onError: (error) => {
      showError(`Failed to release schedule: ${error.message}`);
    }
  });

  // Helper functions
  const canRelease = () => scheduleStatusQuery.data?.data?.readyForRelease || false;

  const studentsReleased = useMemo(() => {
    const d = scheduleStatusQuery.data?.data;
    return Boolean(d?.isReleased || d?.scheduleStatus === 'released');
  }, [scheduleStatusQuery.data]);

  const examinersReleased = useMemo(() => {
    const d = scheduleStatusQuery.data?.data || {};
    // Try to infer from backend status if available; otherwise local
    const server = d.examinersReleased ?? d.examinerReleased ?? d.releasedToExaminers ?? d.examinersPublished;
    if (typeof server === 'boolean') return server;
    return examinerReleasedLocal;
  }, [scheduleStatusQuery.data, examinerReleasedLocal]);

  const releaseToExaminers = (extra = {}) =>
    releaseSchedule.mutate({ audience: 'examiners', notifyExaminers: true, releaseMessage: 'Schedule released to examiners', ...extra });
  const releaseToStudents = (extra = {}) =>
    releaseSchedule.mutate({ audience: 'students', notifyStudents: true, releaseMessage: 'Schedule released to students', ...extra });

  // Withdraw is not supported by the schedule/release endpoint per Swagger.
  // Placeholder implementation to keep UI behavior consistent.
  const withdrawFromExaminers = () => {
    showWarning('Withdraw to examiners is not supported by backend yet.');
  };
  const withdrawFromStudents = () => {
    showWarning('Withdraw to students is not supported by backend yet.');
  };

  const getValidationIssues = () => {
    return scheduleStatusQuery.data?.issues || [];
  };

  // const getStatusSummary = () => {
  //   const data = scheduleStatusQuery.data;
  //   if (!data) return null;

  //   return {
  //     totalSlots: data.summary.totalSlots || 0,
  //     fullyStaffed: data.fullyStaffedSlots || 0,
  //     partiallyStaffed: data.partiallyStaffedSlots || 0,
  //     unstaffed: data.unstaffedSlots || 0,
  //     completionRate: data.totalSlots > 0 ? 
  //       ((data.fullyStaffedSlots || 0) / data.totalSlots * 100).toFixed(1) : 
  //       '0.0',
  //     canRelease: data.canRelease || false,
  //     issues: data.issues || []
  //   };
  // };

  const hasUnstaffedSlots = () => {
    return (scheduleStatusQuery.data?.unstaffedSlots || 0) > 0;
  };

  const hasPartiallyStaffedSlots = () => {
    return (scheduleStatusQuery.data?.partiallyStaffedSlots || 0) > 0;
  };

  const getStaffingStatus = () => {
    const data = scheduleStatusQuery.data;
    if (!data) return 'unknown';

    if (data.unstaffedSlots > 0) return 'incomplete';
    if (data.partiallyStaffedSlots > 0) return 'partial';
    if (data.fullyStaffedSlots === data.totalSlots) return 'complete';
    return 'unknown';
  };

  return {
    // Query data and state
    statusData: scheduleStatusQuery.data,
    isLoadingStatus: scheduleStatusQuery.isLoading,
    isStatusError: scheduleStatusQuery.isError,
    statusError: scheduleStatusQuery.error,
    refetchStatus: scheduleStatusQuery.refetch,

    // Mutation
    release: releaseSchedule.mutate,
    releaseAsync: releaseSchedule.mutateAsync,
    releaseToExaminers,
    releaseToStudents,
    withdrawFromExaminers,
    withdrawFromStudents,
    isReleasing: releaseSchedule.isPending,
    releaseError: releaseSchedule.error,

    // Helper functions and computed properties
    canRelease: canRelease(),
    canReleaseStudents: canRelease(),
    studentsReleased,
    examinersReleased,
    validationIssues: getValidationIssues(),
    // statusSummary: getStatusSummary(),
    hasUnstaffedSlots: hasUnstaffedSlots(),
    hasPartiallyStaffedSlots: hasPartiallyStaffedSlots(),
    staffingStatus: getStaffingStatus()
  };
}

/**
 * Hook for checking if schedule can be released (lightweight)
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} Simple release validation
 */
export function useCanReleaseSchedule(assignmentId) {
  const scheduleStatusQuery = useQuery({
    queryKey: scheduleReleaseKeys.status(assignmentId),
    queryFn: async () => {
      const response = await courseAdminTimeslotService.getScheduleStatus(assignmentId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!assignmentId,
    staleTime: 1 * 60 * 1000,
    select: (data) => ({
      canRelease: data.canRelease || false,
      issues: data.issues || [],
      completionRate: data.totalSlots > 0 ? 
        ((data.fullyStaffedSlots || 0) / data.totalSlots * 100) : 
        0
    })
  });

  return {
    canRelease: scheduleStatusQuery.data?.canRelease || false,
    issues: scheduleStatusQuery.data?.issues || [],
    completionRate: scheduleStatusQuery.data?.completionRate || 0,
    isLoading: scheduleStatusQuery.isLoading,
    isError: scheduleStatusQuery.isError
  };
}

/**
 * Utility function to invalidate schedule release cache
 * @param {Object} queryClient - React Query client instance
 * @param {string} assignmentId - Assignment ID (optional)
 */
export function invalidateScheduleRelease(queryClient, assignmentId = null) {
  if (assignmentId) {
    return queryClient.invalidateQueries({
      queryKey: scheduleReleaseKeys.assignment(assignmentId)
    });
  } else {
    return queryClient.invalidateQueries({
      queryKey: scheduleReleaseKeys.all
    });
  }
}
