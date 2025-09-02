/**
 * React Query hook for session configuration management
 * Handles session config CRUD operations with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseAdminTimeslotService } from '@/services/courseAdminTimeslotService.js';
import { mapSessionConfigFromApi, mapSessionConfigToApi } from '@/lib/timeslotMappers.js';
import { showSuccess, showError } from '@/lib/notifications.js';

/**
 * Query key factory for session configuration
 * @param {string} assignmentId - Assignment ID
 * @returns {Array} Query key array
 */
export const sessionConfigKeys = {
  all: ['assignment'],
  assignment: (assignmentId) => ['assignment', assignmentId, 'session-config']
};

/**
 * Hook for session configuration data and mutations
 * @param {string} assignmentId - Assignment ID
 * @param {Object} options - Additional options
 * @returns {Object} Session config query and mutation functions
 */
export function useSessionConfig(assignmentId, options = {}) {
  const queryClient = useQueryClient();

  // Query for session configuration
  const sessionConfigQuery = useQuery({
    queryKey: sessionConfigKeys.assignment(assignmentId),
    queryFn: async () => {
      const response = await courseAdminTimeslotService.getSessionConfig(assignmentId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return mapSessionConfigFromApi(response.data);
    },
    enabled: !!assignmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });

  // Mutation for saving session configuration
  const saveSessionConfig = useMutation({
    mutationFn: async (configData) => {
      const apiData = mapSessionConfigToApi(configData);
      const response = await courseAdminTimeslotService.saveSessionConfig(assignmentId, apiData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return mapSessionConfigFromApi(response.data);
    },
    onMutate: async (newConfig) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: sessionConfigKeys.assignment(assignmentId)
      });

      // Snapshot the previous value
      const previousConfig = queryClient.getQueryData(
        sessionConfigKeys.assignment(assignmentId)
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        sessionConfigKeys.assignment(assignmentId),
        newConfig
      );

      // Return a context object with the snapshotted value
      return { previousConfig };
    },
    onSuccess: (data, variables, context) => {
      // Update the cache with server response
      queryClient.setQueryData(
        sessionConfigKeys.assignment(assignmentId),
        data
      );
      showSuccess('Session configuration saved successfully');
    },
    onError: (error, variables, context) => {
      // Rollback to the previous value
      if (context?.previousConfig) {
        queryClient.setQueryData(
          sessionConfigKeys.assignment(assignmentId),
          context.previousConfig
        );
      }
      showError(`Failed to save session configuration: ${error.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: sessionConfigKeys.assignment(assignmentId)
      });
    }
  });

  return {
    // Query data and state
    data: sessionConfigQuery.data,
    isLoading: sessionConfigQuery.isLoading,
    isError: sessionConfigQuery.isError,
    error: sessionConfigQuery.error,
    refetch: sessionConfigQuery.refetch,

    // Computed properties
    isConfigured: sessionConfigQuery.data?.isConfigured || false,
    sessionLength: sessionConfigQuery.data?.sessionLength || 30,
    gapTime: sessionConfigQuery.data?.gapTime || 5,
    examinersPerSession: sessionConfigQuery.data?.examinersPerSession || 2,

    // Mutations
    saveConfig: saveSessionConfig.mutate,
    saveConfigAsync: saveSessionConfig.mutateAsync,
    isSaving: saveSessionConfig.isPending,
    saveError: saveSessionConfig.error
  };
}

/**
 * Hook for getting session configuration without mutations
 * Useful for read-only access to session config
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} Session config query data
 */
export function useSessionConfigQuery(assignmentId) {
  return useQuery({
    queryKey: sessionConfigKeys.assignment(assignmentId),
    queryFn: async () => {
      const response = await courseAdminTimeslotService.getSessionConfig(assignmentId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return mapSessionConfigFromApi(response.data);
    },
    enabled: !!assignmentId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Utility function to invalidate session config cache
 * @param {Object} queryClient - React Query client instance
 * @param {string} assignmentId - Assignment ID (optional, invalidates all if not provided)
 */
export function invalidateSessionConfig(queryClient, assignmentId = null) {
  if (assignmentId) {
    return queryClient.invalidateQueries({
      queryKey: sessionConfigKeys.assignment(assignmentId)
    });
  } else {
    return queryClient.invalidateQueries({
      queryKey: sessionConfigKeys.all
    });
  }
}
