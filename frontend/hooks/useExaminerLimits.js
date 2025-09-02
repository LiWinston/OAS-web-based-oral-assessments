/**
 * React Query hook for examiner limits management
 * Handles examiner data and session limit operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseAdminTimeslotService } from '@/services/courseAdminTimeslotService.js';
import { mapExaminersFromApi } from '@/lib/timeslotMappers.js';
import { validateExaminerCapacity } from '@/lib/validation.js';
import { showSuccess, showError, showWarning } from '@/lib/notifications.js';

/**
 * Query key factory for examiners and limits
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} Query key factories
 */
export const examinerLimitsKeys = {
  all: ['assignment'],
  assignment: (assignmentId) => ['assignment', assignmentId, 'examiners'],
  examiners: (assignmentId) => ['assignment', assignmentId, 'examiners']
};

/**
 * Hook for examiner limits data and mutations
 * @param {string} assignmentId - Assignment ID
 * @param {Object} options - Additional query options
 * @returns {Object} Examiner limits query and mutation functions
 */
export function useExaminerLimits(assignmentId, options = {}) {
  const queryClient = useQueryClient();

  // Query for examiners data
  const examinersQuery = useQuery({
    queryKey: examinerLimitsKeys.examiners(assignmentId),
    queryFn: async () => {
      const response = await courseAdminTimeslotService.getExaminers(assignmentId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return mapExaminersFromApi(response.data);
    },
    enabled: !!assignmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes - examiner data doesn't change frequently
    ...options
  });

  // Mutation for updating examiner session limits
  const updateExaminerLimits = useMutation({
    mutationFn: async (limits) => {
      // Transform limits to API format
      const apiLimits = limits.map(limit => ({
        examinerId: limit.examinerId || limit.id,
        maxSessions: parseInt(limit.maxSessions, 10)
      }));

      const response = await courseAdminTimeslotService.updateExaminerLimits(assignmentId, apiLimits);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onMutate: async (newLimits) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: examinerLimitsKeys.examiners(assignmentId)
      });

      // Snapshot the previous value
      const previousExaminers = queryClient.getQueryData(
        examinerLimitsKeys.examiners(assignmentId)
      );

      // Optimistically update examiners with new limits
      if (previousExaminers) {
        const updatedExaminers = previousExaminers.map(examiner => {
          const newLimit = newLimits.find(limit => 
            (limit.examinerId || limit.id) === examiner.id
          );
          return newLimit ? { ...examiner, maxSessions: newLimit.maxSessions } : examiner;
        });

        queryClient.setQueryData(
          examinerLimitsKeys.examiners(assignmentId),
          updatedExaminers
        );
      }

      return { previousExaminers };
    },
    onSuccess: (data, variables) => {
      showSuccess('Examiner limits updated successfully');
    },
    onError: (error, variables, context) => {
      // Rollback to the previous value
      if (context?.previousExaminers) {
        queryClient.setQueryData(
          examinerLimitsKeys.examiners(assignmentId),
          context.previousExaminers
        );
      }
      showError(`Failed to update examiner limits: ${error.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: examinerLimitsKeys.examiners(assignmentId)
      });
    }
  });

  // Helper functions
  const validateCapacity = (totalSessions, examinersPerSession) => {
    if (!examinersQuery.data) {
      return { isValid: false, errors: ['Examiner data not loaded'] };
    }
    
    return validateExaminerCapacity(
      examinersQuery.data,
      totalSessions,
      examinersPerSession
    );
  };

  const getTotalCapacity = () => {
    if (!examinersQuery.data) return 0;
    return examinersQuery.data.reduce((total, examiner) => total + (examiner.maxSessions || 0), 0);
  };

  const getAvailableCapacity = () => {
    if (!examinersQuery.data) return 0;
    return examinersQuery.data.reduce((total, examiner) => {
      const available = (examiner.maxSessions || 0) - (examiner.assignments || 0);
      return total + Math.max(0, available);
    }, 0);
  };

  const getExaminerById = (id) => {
    if (!examinersQuery.data) return null;
    return examinersQuery.data.find(examiner => examiner.id === id);
  };

  const getExaminersWithHighLoad = (threshold = 0.8) => {
    if (!examinersQuery.data) return [];
    return examinersQuery.data.filter(examiner => {
      const maxSessions = examiner.maxSessions || 0;
      const currentAssignments = examiner.assignments || 0;
      return maxSessions > 0 && (currentAssignments / maxSessions) >= threshold;
    });
  };

  const getUnderutilizedExaminers = (threshold = 0.3) => {
    if (!examinersQuery.data) return [];
    return examinersQuery.data.filter(examiner => {
      const maxSessions = examiner.maxSessions || 0;
      const currentAssignments = examiner.assignments || 0;
      return maxSessions > 0 && (currentAssignments / maxSessions) < threshold;
    });
  };

  // Auto-validate capacity when data changes and show warnings
  const autoValidateAndWarn = (totalSessions, examinersPerSession) => {
    if (examinersQuery.data && totalSessions && examinersPerSession) {
      const validation = validateCapacity(totalSessions, examinersPerSession);
      
      if (!validation.isValid) {
        validation.errors.forEach(error => showError(error));
      } else if (validation.hasWarnings) {
        validation.warnings.forEach(warning => showWarning(warning));
      }
      
      return validation;
    }
    return null;
  };

  return {
    // Query data and state
    data: examinersQuery.data || [],
    isLoading: examinersQuery.isLoading,
    isError: examinersQuery.isError,
    error: examinersQuery.error,
    refetch: examinersQuery.refetch,

    // Mutations
    updateLimits: updateExaminerLimits.mutate,
    updateLimitsAsync: updateExaminerLimits.mutateAsync,
    isUpdating: updateExaminerLimits.isPending,
    updateError: updateExaminerLimits.error,

    // Helper functions
    validateCapacity,
    getTotalCapacity,
    getAvailableCapacity,
    getExaminerById,
    getExaminersWithHighLoad,
    getUnderutilizedExaminers,
    autoValidateAndWarn,

    // Computed properties
    totalCapacity: getTotalCapacity(),
    availableCapacity: getAvailableCapacity(),
    examinerCount: examinersQuery.data?.length || 0,
    highLoadExaminers: getExaminersWithHighLoad(),
    underutilizedExaminers: getUnderutilizedExaminers()
  };
}

/**
 * Hook for capacity validation with real-time updates
 * @param {string} assignmentId - Assignment ID
 * @param {number} totalSessions - Total number of sessions needed
 * @param {number} examinersPerSession - Examiners required per session
 * @returns {Object} Real-time capacity validation
 */
export function useCapacityValidation(assignmentId, totalSessions, examinersPerSession) {
  const { data: examiners, isLoading } = useExaminerLimits(assignmentId);
  
  const validation = !isLoading && examiners ? 
    validateExaminerCapacity(examiners, totalSessions, examinersPerSession) : 
    { isValid: false, hasWarnings: false, errors: [], warnings: [] };

  return {
    ...validation,
    isLoading,
    canProceed: validation.isValid && !isLoading
  };
}

/**
 * Utility function to invalidate examiner limits cache
 * @param {Object} queryClient - React Query client instance
 * @param {string} assignmentId - Assignment ID (optional)
 */
export function invalidateExaminerLimits(queryClient, assignmentId = null) {
  if (assignmentId) {
    return queryClient.invalidateQueries({
      queryKey: examinerLimitsKeys.assignment(assignmentId)
    });
  } else {
    return queryClient.invalidateQueries({
      queryKey: examinerLimitsKeys.all
    });
  }
}
