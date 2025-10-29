"use client";

import { useQuery } from "@tanstack/react-query";
import { adminExaminerTrendReportService } from "@/services/adminExaminerTrendReportService.js";

const normaliseParamsObject = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normaliseParamsObject(item));
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(
      ([, v]) => v !== undefined && v !== null
    );
    entries.sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0));
    const result = {};
    entries.forEach(([key, val]) => {
      result[key] = normaliseParamsObject(val);
    });
    return result;
  }
  return value;
};

const serializeParams = (params = {}) => {
  const normalised = normaliseParamsObject(params);
  return JSON.stringify(normalised);
};

const buildSummaryFallback = (assignmentId) =>
  adminExaminerTrendReportService.buildSummaryDefault(assignmentId);

export function useExaminerTrendSummary(assignmentId, params = {}, options = {}) {
  const {
    enabled: enabledOption,
    staleTime = 5 * 60 * 1000,
    refetchOnWindowFocus = false,
    cacheTime,
    ...restOptions
  } = options;

  const paramsKey = serializeParams(params);
  const enabled = Boolean(assignmentId) && (enabledOption ?? true);

  return useQuery({
    queryKey: ["reports", "examiner-trends", "summary", assignmentId, paramsKey],
    queryFn: async () => {
      const response = await adminExaminerTrendReportService.getSummary(
        assignmentId,
        params
      );
      if (!response || response.success === false) {
        return buildSummaryFallback(assignmentId);
      }
      return response.data ?? buildSummaryFallback(assignmentId);
    },
    enabled,
    staleTime,
    refetchOnWindowFocus,
    ...(cacheTime !== undefined ? { cacheTime } : {}),
    ...restOptions,
  });
}

export const examinerTrendDefaults = {
  summary: buildSummaryFallback(null),
};
