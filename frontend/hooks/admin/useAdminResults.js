"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminResultsService } from "@/services/adminResultsService";
import { useNotification } from "@/hooks/useNotification";

// Query keys
export const adminResultsKeys = {
  all: ["admin", "results"],
  consolidated: (assignmentId, filters = {}) => ["admin", "results", "consolidated", assignmentId, filters],
  entity: (assignmentId, sessionId, kind, entityId) => ["admin", "results", "entity", assignmentId, sessionId, kind, entityId],
  aggregation: (assignmentId) => ["admin", "results", "aggregation", assignmentId],
  schedule: (assignmentId) => ["admin", "results", "schedule", assignmentId],
};

// Queries
export function useConsolidatedResults(assignmentId, filters = {}, options = {}) {
  return useQuery({
    queryKey: adminResultsKeys.consolidated(assignmentId, filters),
    queryFn: async () => {
      const res = await adminResultsService.getConsolidatedResults(assignmentId, filters);
      return res.data; // unwrap to payload
    },
    enabled: !!assignmentId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    ...options,
  });
}

export function useEntityDetail(assignmentId, sessionId, kind, entityId, options = {}) {
  return useQuery({
    queryKey: adminResultsKeys.entity(assignmentId, sessionId, kind, entityId),
    queryFn: async () => {
      const res = await adminResultsService.getEntityDetail(assignmentId, sessionId, kind, entityId);
      return res.data;
    },
    enabled: !!assignmentId && !!sessionId && !!kind && !!entityId,
    staleTime: 30_000,
    ...options,
  });
}

export function useAggregation(assignmentId, options = {}) {
  return useQuery({
    queryKey: adminResultsKeys.aggregation(assignmentId),
    queryFn: async () => {
      const res = await adminResultsService.getAggregationMethod(assignmentId);
      return res.data;
    },
    enabled: !!assignmentId,
    staleTime: 30_000,
    ...options,
  });
}

// Mutations
export function useSetAggregation() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationFn: async ({ assignmentId, method }) => {
      const res = await adminResultsService.setAggregationMethod(assignmentId, method);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminResultsKeys.aggregation(vars.assignmentId) });
      // Invalidate all consolidated queries for this assignment (any filters)
      queryClient.invalidateQueries({ queryKey: ["admin", "results", "consolidated", vars.assignmentId] });
      showNotification("success", "Aggregation updated");
    },
  });
}

export function useReleaseResults() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationFn: async ({ assignmentId, entities, notify }) => {
      const res = await adminResultsService.releaseResults(assignmentId, { scope: "SELECTION", entities, notify: !!notify });
      return res.data;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "results", "consolidated", vars.assignmentId] });
      showNotification("success", `Successfully released ${data?.releasedCount ?? 0} results`);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to release results";
      showNotification("error", msg);
    },
  });
}

export function useWithdrawResults() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationFn: async ({ assignmentId, entities, reason }) => {
      const res = await adminResultsService.withdrawResults(assignmentId, { scope: "SELECTION", entities, reason });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "results", "consolidated", vars.assignmentId] });
      showNotification("success", "Results withdrawn");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to withdraw results";
      showNotification("error", msg);
    },
  });
}

export function useSchedule(assignmentId, options = {}) {
  return useQuery({
    queryKey: adminResultsKeys.schedule(assignmentId),
    queryFn: async () => {
      const res = await adminResultsService.getPublicationSchedule(assignmentId);
      return res.data;
    },
    enabled: !!assignmentId,
    staleTime: 30_000,
    ...options,
  });
}

export function useSetSchedule() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationFn: async ({ assignmentId, schedule }) => {
      const res = await adminResultsService.setPublicationSchedule(assignmentId, {
        status: schedule.status,
        at: schedule.at,
        notify: !!schedule.notify,
      });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminResultsKeys.schedule(vars.assignmentId) });
      showNotification("success", "Schedule saved");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to save schedule";
      showNotification("error", msg);
    },
  });
}

export function useSetOverride() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationFn: async ({ assignmentId, sessionId, entityKind, entityId, valuePct1dp, reason }) => {
      const res = await adminResultsService.setOverride(assignmentId, sessionId, entityKind, entityId, { finalOverridePct1dp: valuePct1dp, reason });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminResultsKeys.entity(vars.assignmentId, vars.sessionId, vars.entityKind, vars.entityId) });
      showNotification("success", "Override applied");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to apply override";
      showNotification("error", msg);
    },
  });
}

export function useClearOverride() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationFn: async ({ assignmentId, sessionId, entityKind, entityId }) => {
      const res = await adminResultsService.clearOverride(assignmentId, sessionId, entityKind, entityId);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: adminResultsKeys.entity(vars.assignmentId, vars.sessionId, vars.entityKind, vars.entityId) });
      showNotification("success", "Override cleared");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to clear override";
      showNotification("error", msg);
    },
  });
}

// Optional: Review mutation
export function useReviewEntity() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  return useMutation({
    mutationFn: async ({ assignmentId, sessionId, entityKind, entityId, request }) => {
      const res = await adminResultsService.reviewEntity(assignmentId, sessionId, entityKind, entityId, request);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminResultsKeys.all });
      showNotification("success", "Review requested");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to request review";
      showNotification("error", msg);
    },
  });
}
