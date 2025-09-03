"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import examinerAssessmentService from "../../../services/examinerAssessmentService";

export function useMarkingSessionQuery(sessionId, examinerId) {
  return useQuery({
    queryKey: ["markingSessionContext", sessionId, examinerId],
    queryFn: async () => {
      const res = await examinerAssessmentService.getSessionContext(
        sessionId,
        examinerId
      );
      if (!res?.success) {
        const err = new Error(res?.message || "Failed to load session context");
        err.code = res?.code || "ERROR";
        throw err;
      }
      return res.data;
    },
    enabled: Boolean(sessionId && examinerId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSaveDraftMutation(sessionId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["saveAssessmentDraft", sessionId],
    mutationFn: async (payload) => {
      const res = await examinerAssessmentService.saveDraft(sessionId, payload);
      if (!res?.success) {
        const err = new Error(res?.message || "Failed to save draft");
        err.code = res?.code || "ERROR";
        throw err;
      }
      return res.data;
    },
    onSuccess: () => {
      // Keep cache warm; context can be refetched if needed later
      queryClient.invalidateQueries({ queryKey: ["markingSessionContext", sessionId] });
    },
  });
}

export function useSubmitAssessmentMutation(sessionId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["submitAssessment", sessionId],
    mutationFn: async ({ assessmentId }) => {
      const res = await examinerAssessmentService.submitAssessment(
        sessionId,
        assessmentId
      );
      if (!res?.success) {
        const err = new Error(res?.message || "Failed to submit assessment");
        err.code = res?.code || "ERROR";
        throw err;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markingSessionContext", sessionId] });
    },
  });
}
