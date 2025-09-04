/**
 * React Query hook for time slots management
 * Handles time slots CRUD operations with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseAdminTimeslotService } from '@/services/courseAdminTimeslotService.js';
import { mapTimeSlotsFromApi, mapTimeSlotsToApi, mapTimeSlotFromApi, mapTimeSlotToApi } from '@/lib/timeslotMappers.js';
import { showSuccess, showError } from '@/lib/notifications.js';

/**
 * Query key factory for time slots
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} Query key factories
 */
export const timeSlotsKeys = {
  all: ['assignment'],
  assignment: (assignmentId) => ['assignment', assignmentId, 'timeslots'],
  filtered: (assignmentId, filters) => ['assignment', assignmentId, 'timeslots', filters]
};

/**
 * Hook for time slots data and mutations
 * @param {string} assignmentId - Assignment ID
 * @param {Object} filters - Optional filters (date, status)
 * @param {Object} options - Additional query options
 * @returns {Object} Time slots query and mutation functions
 */
export function useTimeSlots(assignmentId, filters = {}, options = {}) {
  const queryClient = useQueryClient();

  // Query for time slots
  const timeSlotsQuery = useQuery({
    queryKey: timeSlotsKeys.filtered(assignmentId, filters),
    queryFn: async () => {
      const response = await courseAdminTimeslotService.getTimeSlots(assignmentId, filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return mapTimeSlotsFromApi(response.data);
    },
    enabled: !!assignmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });

  // Mutation for creating time slots in batch
  const createTimeSlotsBatch = useMutation({
    mutationFn: async (timeSlots) => {
      const apiData = mapTimeSlotsToApi(timeSlots);
      const response = await courseAdminTimeslotService.createTimeSlotsBatch(assignmentId, { timeSlots: apiData });
      if (!response.success) {
        throw new Error(response.message);
      }
      return mapTimeSlotsFromApi(response.data);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch time slots queries
      queryClient.invalidateQueries({
        queryKey: timeSlotsKeys.assignment(assignmentId)
      });
      // Invalidate calendar dots and schedule status
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'schedule', 'status'] });
      showSuccess(`${data.length} time slots created successfully`);
    },
    onError: (error) => {
      showError(`Failed to create time slots: ${error.message}`);
    }
  });

  // Mutation for updating a single time slot
  const updateTimeSlot = useMutation({
    mutationFn: async ({ timeSlotId, data }) => {
      const apiData = mapTimeSlotToApi(data);
      const response = await courseAdminTimeslotService.updateTimeSlot(assignmentId, timeSlotId, apiData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return mapTimeSlotFromApi(response.data);
    },
    onMutate: async ({ timeSlotId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: timeSlotsKeys.assignment(assignmentId)
      });

      // Get all relevant queries to update
      const queryKeys = queryClient.getQueryCache()
        .findAll({ queryKey: timeSlotsKeys.assignment(assignmentId) })
        .map(query => query.queryKey);

      const previousData = {};

      // Update each query optimistically
      queryKeys.forEach(queryKey => {
        const oldData = queryClient.getQueryData(queryKey);
        if (oldData && Array.isArray(oldData)) {
          previousData[JSON.stringify(queryKey)] = oldData;
          
          const updatedData = oldData.map(slot => 
            slot.id === timeSlotId ? { ...slot, ...data } : slot
          );
          
          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      return { previousData, queryKeys };
    },
    onSuccess: (updatedSlot, variables) => {
      showSuccess('Time slot updated successfully');
      // Times changed may affect calendar dots and release readiness
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'schedule', 'status'] });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData && context?.queryKeys) {
        context.queryKeys.forEach(queryKey => {
          const previousValue = context.previousData[JSON.stringify(queryKey)];
          if (previousValue) {
            queryClient.setQueryData(queryKey, previousValue);
          }
        });
      }
      showError(`Failed to update time slot: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: timeSlotsKeys.assignment(assignmentId) });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'schedule', 'status'] });
    }
  });

  // Mutation for deleting time slots
  const deleteTimeSlots = useMutation({
    mutationFn: async (timeSlotIds) => {
      const response = await courseAdminTimeslotService.deleteTimeSlots(assignmentId, timeSlotIds);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onMutate: async (timeSlotIds) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: timeSlotsKeys.assignment(assignmentId)
      });

      // Get all relevant queries to update
      const queryKeys = queryClient.getQueryCache()
        .findAll({ queryKey: timeSlotsKeys.assignment(assignmentId) })
        .map(query => query.queryKey);

      const previousData = {};

      // Update each query optimistically
      queryKeys.forEach(queryKey => {
        const oldData = queryClient.getQueryData(queryKey);
        if (oldData && Array.isArray(oldData)) {
          previousData[JSON.stringify(queryKey)] = oldData;
          
          const filteredData = oldData.filter(slot => !timeSlotIds.includes(slot.id));
          queryClient.setQueryData(queryKey, filteredData);
        }
      });

      return { previousData, queryKeys };
    },
    onSuccess: (result, timeSlotIds) => {
      const count = result.deletedCount || timeSlotIds.length;
      showSuccess(`${count} time slot${count > 1 ? 's' : ''} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'schedule', 'status'] });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData && context?.queryKeys) {
        context.queryKeys.forEach(queryKey => {
          const previousValue = context.previousData[JSON.stringify(queryKey)];
          if (previousValue) {
            queryClient.setQueryData(queryKey, previousValue);
          }
        });
      }
      showError(`Failed to delete time slots: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: timeSlotsKeys.assignment(assignmentId) });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'schedule', 'status'] });
    }
  });

  // Mutation for duplicating a time slot
  const duplicateTimeSlot = useMutation({
    mutationFn: async ({ timeSlotId, options = {} }) => {
      const response = await courseAdminTimeslotService.duplicateTimeSlot(assignmentId, timeSlotId, options);
      if (!response.success) {
        throw new Error(response.message);
      }
      return mapTimeSlotFromApi(response.data);
    },
    onSuccess: (duplicatedSlot) => {
      queryClient.invalidateQueries({ queryKey: timeSlotsKeys.assignment(assignmentId) });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId, 'schedule', 'status'] });
      showSuccess('Time slot duplicated successfully');
    },
    onError: (error) => {
      showError(`Failed to duplicate time slot: ${error.message}`);
    }
  });

  return {
    // Query data and state
    data: timeSlotsQuery.data || [],
    isLoading: timeSlotsQuery.isLoading,
    isError: timeSlotsQuery.isError,
    error: timeSlotsQuery.error,
    refetch: timeSlotsQuery.refetch,

    // Mutations
    createBatch: createTimeSlotsBatch.mutate,
    createBatchAsync: createTimeSlotsBatch.mutateAsync,
    isCreatingBatch: createTimeSlotsBatch.isPending,

    updateSlot: updateTimeSlot.mutate,
    updateSlotAsync: updateTimeSlot.mutateAsync,
    isUpdating: updateTimeSlot.isPending,

    deleteSlots: deleteTimeSlots.mutate,
    deleteSlotsAsync: deleteTimeSlots.mutateAsync,
    isDeleting: deleteTimeSlots.isPending,

    duplicateSlot: duplicateTimeSlot.mutate,
    duplicateSlotAsync: duplicateTimeSlot.mutateAsync,
    isDuplicating: duplicateTimeSlot.isPending,

    // Helper functions
    getSlotById: (id) => timeSlotsQuery.data?.find(slot => slot.id === id),
    getSlotsForDate: (date) => timeSlotsQuery.data?.filter(slot => slot.date === date) || [],
    getSlotsByStatus: (status) => timeSlotsQuery.data?.filter(slot => slot.status === status) || []
  };
}

/**
 * Hook for getting time slots for a specific date
 * @param {string} assignmentId - Assignment ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Time slots query for the specific date
 */
export function useTimeSlotsForDate(assignmentId, date) {
  return useTimeSlots(assignmentId, { date }, { enabled: !!assignmentId && !!date });
}

/**
 * Utility function to invalidate time slots cache
 * @param {Object} queryClient - React Query client instance
 * @param {string} assignmentId - Assignment ID (optional)
 */
export function invalidateTimeSlots(queryClient, assignmentId = null) {
  if (assignmentId) {
    return queryClient.invalidateQueries({
      queryKey: timeSlotsKeys.assignment(assignmentId)
    });
  } else {
    return queryClient.invalidateQueries({
      queryKey: timeSlotsKeys.all
    });
  }
}
