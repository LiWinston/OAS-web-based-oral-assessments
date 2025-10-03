"use client";

import { useQuery } from "@tanstack/react-query";
import { adminSchedulingReportService } from "@/services/adminSchedulingReportService";

const defaultCalendarData = {};
const defaultSessionsData = {
  sessions: [],
  summary: null,
  venues: [],
  outsideAssignmentRange: false,
};

export function useSchedulingCalendar(assignmentId, month, options = {}) {
  const enabled = Boolean(assignmentId) && (options.enabled ?? true);

  return useQuery({
    queryKey: [
      "reports",
      "scheduling",
      "calendar",
      assignmentId,
      month || "",
    ],
    queryFn: async () => {
      const response = await adminSchedulingReportService.getCalendar(assignmentId, month);
      return response?.data || defaultCalendarData;
    },
    enabled,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  });
}

export function useSchedulingSessions(assignmentId, params = {}, options = {}) {
  const dateValue = params?.date;
  const dateKey = Array.isArray(dateValue)
    ? dateValue.join(",")
    : dateValue || "";
  const venueKey = params?.venueId || "";
  const statusKey = params?.status || "";
  const searchKey = params?.q || params?.search || "";
  const refreshKey = params?.refreshKey || options.refreshKey || 0;

  const enabled = Boolean(assignmentId) && (options.enabled ?? true) && (options.allowEmptyDate || Boolean(dateKey));

  return useQuery({
    queryKey: [
      "reports",
      "scheduling",
      "sessions",
      assignmentId,
      dateKey,
      venueKey,
      statusKey,
      searchKey,
      refreshKey,
    ],
    queryFn: async () => {
      const response = await adminSchedulingReportService.getSessions(assignmentId, params);
      if (!response?.success) {
        return defaultSessionsData;
      }
      return {
        sessions: response?.data?.sessions || [],
        summary: response?.data?.summary || null,
        venues: response?.data?.venues || [],
        outsideAssignmentRange: Boolean(response?.data?.outsideAssignmentRange),
      };
    },
    enabled,
    staleTime: options.staleTime ?? 60 * 1000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  });
}

export function useSchedulingPublishStatus(assignmentId, options = {}) {
  const enabled = Boolean(assignmentId) && (options.enabled ?? true);

  return useQuery({
    queryKey: ["reports", "scheduling", "publish", assignmentId],
    queryFn: async () => {
      const response = await adminSchedulingReportService.getPublishStatus(assignmentId);
      return response?.data || { examiners: false, students: false };
    },
    enabled,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  });
}

export function useSchedulingAssignmentMeta(assignmentId, options = {}) {
  const enabled = Boolean(assignmentId) && (options.enabled ?? true);

  return useQuery({
    queryKey: ["reports", "scheduling", "meta", assignmentId],
    queryFn: async () => {
      const response = await adminSchedulingReportService.getAssignmentMeta(assignmentId);
      return response?.data || null;
    },
    enabled,
    staleTime: options.staleTime ?? 10 * 60 * 1000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  });
}

