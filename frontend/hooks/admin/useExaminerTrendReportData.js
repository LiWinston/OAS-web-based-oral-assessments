"use client";

import { useQuery } from "@tanstack/react-query";
import { adminExaminerTrendReportService } from "@/services/adminExaminerTrendReportService.js";

const DEFAULT_BUILDERS = adminExaminerTrendReportService.buildDefaults(null, null);

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

const buildOverviewFallback = (assignmentId, component) =>
  adminExaminerTrendReportService.buildDefaults(assignmentId, component).overview;

const buildTimeseriesFallback = (assignmentId, component) =>
  adminExaminerTrendReportService.buildDefaults(assignmentId, component).timeseries;

const buildDistributionFallback = (assignmentId, component) =>
  adminExaminerTrendReportService.buildDefaults(assignmentId, component).distribution;

const buildOutliersFallback = (assignmentId, component) =>
  adminExaminerTrendReportService.buildDefaults(assignmentId, component).outliers;

export function useExaminerTrendOverview(assignmentId, params = {}, options = {}) {
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
    queryKey: ["reports", "examiner-trends", "overview", assignmentId, paramsKey],
    queryFn: async () => {
      const response = await adminExaminerTrendReportService.getOverview(
        assignmentId,
        params
      );
      if (!response || response.success === false) {
        return buildOverviewFallback(assignmentId, params?.component);
      }
      return (
        response.data ??
        buildOverviewFallback(assignmentId, params?.component)
      );
    },
    enabled,
    staleTime,
    refetchOnWindowFocus,
    ...(cacheTime !== undefined ? { cacheTime } : {}),
    ...restOptions,
  });
}

export function useExaminerTrendTimeseries(assignmentId, params = {}, options = {}) {
  const {
    enabled: enabledOption,
    staleTime = 60 * 1000,
    refetchOnWindowFocus = false,
    cacheTime,
    ...restOptions
  } = options;

  const paramsKey = serializeParams(params);
  const enabled = Boolean(assignmentId) && (enabledOption ?? true);

  return useQuery({
    queryKey: ["reports", "examiner-trends", "timeseries", assignmentId, paramsKey],
    queryFn: async () => {
      const response = await adminExaminerTrendReportService.getTimeseries(
        assignmentId,
        params
      );
      if (!response || response.success === false) {
        return buildTimeseriesFallback(assignmentId, params?.component);
      }
      return (
        response.data ??
        buildTimeseriesFallback(assignmentId, params?.component)
      );
    },
    enabled,
    staleTime,
    refetchOnWindowFocus,
    ...(cacheTime !== undefined ? { cacheTime } : {}),
    ...restOptions,
  });
}

export function useExaminerTrendDistribution(assignmentId, params = {}, options = {}) {
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
    queryKey: ["reports", "examiner-trends", "distribution", assignmentId, paramsKey],
    queryFn: async () => {
      const response = await adminExaminerTrendReportService.getDistribution(
        assignmentId,
        params
      );
      if (!response || response.success === false) {
        return buildDistributionFallback(assignmentId, params?.component);
      }
      return (
        response.data ??
        buildDistributionFallback(assignmentId, params?.component)
      );
    },
    enabled,
    staleTime,
    refetchOnWindowFocus,
    ...(cacheTime !== undefined ? { cacheTime } : {}),
    ...restOptions,
  });
}

export function useExaminerTrendOutliers(assignmentId, params = {}, options = {}) {
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
    queryKey: ["reports", "examiner-trends", "outliers", assignmentId, paramsKey],
    queryFn: async () => {
      const response = await adminExaminerTrendReportService.getOutlierSessions(
        assignmentId,
        params
      );
      if (!response || response.success === false) {
        return buildOutliersFallback(assignmentId, params?.component);
      }
      return (
        response.data ??
        buildOutliersFallback(assignmentId, params?.component)
      );
    },
    enabled,
    staleTime,
    refetchOnWindowFocus,
    ...(cacheTime !== undefined ? { cacheTime } : {}),
    ...restOptions,
  });
}

export const examinerTrendDefaults = {
  overview: DEFAULT_BUILDERS.overview,
  timeseries: DEFAULT_BUILDERS.timeseries,
  distribution: DEFAULT_BUILDERS.distribution,
  outliers: DEFAULT_BUILDERS.outliers,
};
