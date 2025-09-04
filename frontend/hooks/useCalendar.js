/**
 * React Query hook for calendar data management
 * Handles monthly calendar data with time slot aggregations
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { courseAdminTimeslotService } from '@/services/courseAdminTimeslotService.js';

/**
 * Query key factory for calendar data
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} Query key factories
 */
export const calendarKeys = {
  all: ['assignment'],
  assignment: (assignmentId) => ['assignment', assignmentId, 'calendar'],
  month: (assignmentId, month) => ['assignment', assignmentId, 'calendar', month]
};

/**
 * Hook for calendar data
 * @param {string} assignmentId - Assignment ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Object} options - Additional query options
 * @returns {Object} Calendar query data and functions
 */
export function useCalendar(assignmentId, month, options = {}) {
  const queryClient = useQueryClient();

  // Query for calendar data
  const calendarQuery = useQuery({
    queryKey: calendarKeys.month(assignmentId, month),
    queryFn: async () => {
      const response = await courseAdminTimeslotService.getCalendar(assignmentId, month);
      if (!response.success) {
        throw new Error(response.message);
      }
      // Use backend structure directly: response.data is expected to be { [date]: { timeSlots, sessions, status } }
      // If service returns { month, dates }, extract dates
      const data = response.data;
      if (data && data.dates) return data.dates;
      return data || {};
    },
    enabled: !!assignmentId && !!month,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });

  // Helper functions for calendar data
  const getStatusForDate = (date) => {
    const day = calendarQuery.data?.[date];
    return day?.status || null;
  };

  const getSlotCountForDate = (date) => {
    const day = calendarQuery.data?.[date];
    return day?.timeSlots ?? 0;
  };

  const getSessionCountForDate = (date) => {
    const day = calendarQuery.data?.[date];
    return day?.sessions ?? 0;
  };

  const getDatesWithSlots = () => {
    if (!calendarQuery.data) {
      return [];
    }
    return Object.keys(calendarQuery.data).filter(date => (calendarQuery.data[date].timeSlots ?? 0) > 0);
  };

  const getDatesWithStatus = (status) => {
    if (!calendarQuery.data) {
      return [];
    }
    return Object.keys(calendarQuery.data).filter(date => 
      calendarQuery.data[date].status === status
    );
  };

  const getTotalStats = () => {
    if (!calendarQuery.data) {
      return {
        totalDaysWithSlots: 0,
        totalSlots: 0,
        totalSessions: 0,
        fullyStaffedDays: 0,
        partiallyStaffedDays: 0,
        unstaffedDays: 0
      };
    }

    const dates = Object.keys(calendarQuery.data);
    const stats = {
      totalDaysWithSlots: dates.length,
      totalSlots: 0,
      totalSessions: 0,
      fullyStaffedDays: 0,
      partiallyStaffedDays: 0,
      unstaffedDays: 0
    };

    dates.forEach(date => {
      const dayData = calendarQuery.data[date];
      stats.totalSlots += (dayData.timeSlots ?? 0);
      stats.totalSessions += (dayData.sessions ?? 0);

      switch (dayData.status) {
        case 'full':
          stats.fullyStaffedDays++;
          break;
        case 'partial':
          stats.partiallyStaffedDays++;
          break;
        case 'empty':
          stats.unstaffedDays++;
          break;
      }
    });

    return stats;
  };

  return {
    // Query data and state
    data: calendarQuery.data || {},
    isLoading: calendarQuery.isLoading,
    isError: calendarQuery.isError,
    error: calendarQuery.error,
    refetch: calendarQuery.refetch,

    // Helper functions
    getStatusForDate,
    getSlotCountForDate,
    getSessionCountForDate,
    getDatesWithSlots,
    getDatesWithStatus,
    getTotalStats,

    // Computed data
    stats: getTotalStats(),
    datesWithSlots: getDatesWithSlots(),
    fullyStaffedDates: getDatesWithStatus('full'),
    partiallyStaffedDates: getDatesWithStatus('partial'),
    unstaffedDates: getDatesWithStatus('empty')
  };
}

/**
 * Hook for getting current month calendar data
 * @param {string} assignmentId - Assignment ID
 * @returns {Object} Current month calendar data
 */
export function useCurrentMonthCalendar(assignmentId) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  return useCalendar(assignmentId, currentMonth);
}

/**
 * Hook for multiple months calendar data
 * @param {string} assignmentId - Assignment ID
 * @param {Array<string>} months - Array of months in YYYY-MM format
 * @returns {Object} Multi-month calendar data
 */
export function useMultiMonthCalendar(assignmentId, months) {
  const queryClient = useQueryClient();

  // Create queries for each month
  const monthQueries = months.map(month => ({
    queryKey: calendarKeys.month(assignmentId, month),
    queryFn: async () => {
      const response = await courseAdminTimeslotService.getCalendar(assignmentId, month);
      if (!response.success) {
        throw new Error(response.message);
      }
      const data = response.data?.dates || response.data || {};
      return { month, data };
    },
    enabled: !!assignmentId && !!month,
    staleTime: 5 * 60 * 1000
  }));

  const queries = monthQueries.map(queryOptions => 
    useQuery(queryOptions)
  );

  // Combine data from all months
  const combinedData = {};
  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const errors = queries.filter(query => query.isError).map(query => query.error);

  queries.forEach(query => {
    if (query.data) {
      Object.assign(combinedData, query.data.data);
    }
  });

  return {
    data: combinedData,
    isLoading,
    isError,
    errors,
    refetchAll: () => queries.forEach(query => query.refetch())
  };
}

/**
 * Utility function to get month range
 * @param {string} startMonth - Start month in YYYY-MM format
 * @param {number} count - Number of months to include
 * @returns {Array<string>} Array of month strings
 */
export function getMonthRange(startMonth, count) {
  const months = [];
  const date = new Date(startMonth + '-01');
  
  for (let i = 0; i < count; i++) {
    months.push(date.toISOString().slice(0, 7));
    date.setMonth(date.getMonth() + 1);
  }
  
  return months;
}

/**
 * Utility function to invalidate calendar cache
 * @param {Object} queryClient - React Query client instance
 * @param {string} assignmentId - Assignment ID (optional)
 * @param {string} month - Specific month to invalidate (optional)
 */
export function invalidateCalendar(queryClient, assignmentId = null, month = null) {
  if (assignmentId && month) {
    return queryClient.invalidateQueries({
      queryKey: calendarKeys.month(assignmentId, month)
    });
  } else if (assignmentId) {
    return queryClient.invalidateQueries({
      queryKey: calendarKeys.assignment(assignmentId)
    });
  } else {
    return queryClient.invalidateQueries({
      queryKey: calendarKeys.all
    });
  }
}
