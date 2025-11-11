"use client";

import { useQuery } from "@tanstack/react-query";
import { adminResultsService } from "@/services/adminResultsService.js";

const QUERY_KEY = "admin-mark-consolidation-alerts";

const normaliseAlert = (item) => {
  const alert = item ?? {};
  const participant = alert.participant ?? {};
  const session = participant.session ?? alert.session ?? {};

  return {
    alertType: alert.alertType ?? "UNKNOWN",
    message: alert.message ?? "",
    lastUpdatedAt: alert.lastUpdatedAt ?? null,
    examinerSummary: {
      total: alert.examinerSummary?.total ?? 0,
      submitted: alert.examinerSummary?.submitted ?? 0,
      reopened: alert.examinerSummary?.reopened ?? 0,
      pending: alert.examinerSummary?.pending ?? 0,
    },
    participant: {
      id: participant.id ?? null,
      name: participant.name ?? participant.displayName ?? "Participant",
      type: participant.type ?? "INDIVIDUAL",
      session: {
        id: session.id ?? session.sessionId ?? null,
        start: session.start ?? null,
        end: session.end ?? null,
        venueName: session.venueName ?? session.venue?.name ?? null,
      },
    },
  };
};

const normaliseAlerts = (payload) => {
  const root = payload?.data ?? payload ?? {};
  const items = Array.isArray(root.items) ? root.items : root.alerts ?? [];
  return items.map(normaliseAlert);
};

export function useMarkConsolidationAlerts(subjectId, assignmentId, params = {}, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [
      QUERY_KEY,
      subjectId,
      assignmentId,
      params.sessionId ?? "all",
      params.types ?? "all",
      params.limit ?? 10,
    ],
    queryFn: async () => {
      const response = await adminResultsService.getMarkConsolidationAlerts(
        subjectId,
        assignmentId,
        params
      );
      return normaliseAlerts(response);
    },
    enabled: Boolean(subjectId && assignmentId && enabled),
    staleTime: options.staleTime ?? 30_000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  });
}

export default useMarkConsolidationAlerts;
