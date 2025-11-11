"use client";

import { useQuery } from "@tanstack/react-query";
import { adminResultsService } from "@/services/adminResultsService.js";

const QUERY_KEY = "admin-mark-consolidation-trends";

const normalisePoint = (point) => ({
  bucket: point?.bucket ?? "",
  count: Number.isFinite(point?.count) ? point.count : 0,
  cumulative: Number.isFinite(point?.cumulative) ? point.cumulative : null,
});

const normaliseSeries = (series = []) => series.map((item) => ({
  name: item?.name ?? item?.key ?? "Series",
  key: item?.key ?? item?.name ?? "series",
  points: Array.isArray(item?.points) ? item.points.map(normalisePoint) : [],
}));

const normaliseTrends = (payload) => {
  const root = payload?.data ?? payload ?? {};
  return {
    interval: root.interval ?? "day",
    timezone: root.timezone ?? "Australia/Melbourne",
    series: normaliseSeries(root.series),
  };
};

export function useMarkConsolidationTrends(subjectId, assignmentId, params = {}, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: [
      QUERY_KEY,
      subjectId,
      assignmentId,
      params.interval ?? "day",
      params.rangeStart ?? null,
      params.rangeEnd ?? null,
      params.sessionId ?? "all",
    ],
    queryFn: async () => {
      const response = await adminResultsService.getMarkConsolidationTrends(
        subjectId,
        assignmentId,
        params
      );
      return normaliseTrends(response);
    },
    enabled: Boolean(subjectId && assignmentId && enabled),
    staleTime: options.staleTime ?? 60_000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  });
}

export default useMarkConsolidationTrends;
