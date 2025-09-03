/**
 * React Query hooks for venue management (dummy backend)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venueService } from '@/services/venueService.js';

export const venueKeys = {
  all: ['venues'],
  list: (assignmentId, query = '') => ['venues', assignmentId, { query }]
};

export function useVenues(assignmentId, query = '') {
  const queryClient = useQueryClient();

  const venuesQuery = useQuery({
    queryKey: venueKeys.list(assignmentId, query),
    queryFn: async () => {
      const res = await venueService.list(assignmentId, query);
      if (!res.success) throw new Error(res.message || 'Failed to load venues');
      return res.data || [];
    },
    enabled: !!assignmentId,
    staleTime: 5 * 60 * 1000
  });

  const createVenue = useMutation({
    mutationFn: async ({ name }) => {
      const res = await venueService.create(name, assignmentId);
      if (!res.success) throw new Error(res.message || 'Failed to create venue');
      return res.data;
    },
    onSuccess: (newVenue) => {
      // Invalidate all venue lists
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    }
  });

  return {
    data: venuesQuery.data || [],
    isLoading: venuesQuery.isLoading,
    isError: venuesQuery.isError,
    error: venuesQuery.error,
    refetch: venuesQuery.refetch,

    // Allow passing react-query mutate options for optimistic flows
    create: (name, options) => createVenue.mutate({ name }, options),
    createAsync: (name, options) => createVenue.mutateAsync({ name }, options),
    isCreating: createVenue.isPending
  };
}
