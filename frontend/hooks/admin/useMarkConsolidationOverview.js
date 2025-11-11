"use client";

import { useQuery } from "@tanstack/react-query";
import { adminResultsService } from "@/services/adminResultsService.js";

const QUERY_KEY = "admin-mark-consolidation-overview";

const normaliseOverview = (payload) => {
  const root = payload?.data ?? payload ?? {};
  return {
    assignment: root.assignment ?? null,
    totals: {
      participants: root.totals?.participants ?? 0,
      groups: root.totals?.groups ?? 0,
      individuals: root.totals?.individuals ?? 0,
    },
    progress: {
      ready: root.progress?.ready ?? 0,
      needsAttention: root.progress?.needsAttention ?? 0,
      awaiting: root.progress?.awaiting ?? 0,
    },
    release: {
      released: root.release?.released ?? 0,
      notReleased: root.release?.notReleased ?? 0,
      lastReleasedAt: root.release?.lastReleasedAt ?? null,
    },
    examinerSubmissions: {
      total: root.examinerSubmissions?.total ?? 0,
      submitted: root.examinerSubmissions?.submitted ?? 0,
      draft: root.examinerSubmissions?.draft ?? 0,
      reopened: root.examinerSubmissions?.reopened ?? 0,
      pending: root.examinerSubmissions?.pending ?? 0,
      submittedRatio: root.examinerSubmissions?.submittedRatio ?? null,
    },
    manualOverrides: {
      count: root.manualOverrides?.count ?? 0,
      lastUpdatedAt: root.manualOverrides?.lastUpdatedAt ?? null,
    },
    freshness: {
      lastActivityAt: root.freshness?.lastActivityAt ?? null,
      lastExaminerSubmissionAt: root.freshness?.lastExaminerSubmissionAt ?? null,
    },
  };
};

export function useMarkConsolidationOverview(subjectId, assignmentId, params = {}, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [QUERY_KEY, subjectId, assignmentId, params.sessionId ?? "all"],
    queryFn: async () => {
      const response = await adminResultsService.getMarkConsolidationOverview(
        subjectId,
        assignmentId,
        params
      );
      return normaliseOverview(response);
    },
    enabled: Boolean(subjectId && assignmentId && enabled),
    staleTime: options.staleTime ?? 60_000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  });
}

export default useMarkConsolidationOverview;
