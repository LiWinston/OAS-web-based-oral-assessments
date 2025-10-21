import apiClient from "@/services/apiClient.js";

const DEFAULT_COMPONENT = "GROUP";

const extract = (resp) => {
  if (!resp) return null;
  const data = resp.data;
  if (data && typeof data === "object" && "data" in data) {
    return data.data;
  }
  return data ?? null;
};

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const clampRatio = (value) => {
  const numeric = toNumber(value, 0);
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return numeric;
};

const normaliseComponent = (component) => {
  if (!component || typeof component !== "string") return DEFAULT_COMPONENT;
  return component.toUpperCase();
};

const buildOverviewDefault = (assignmentId, component) => ({
  assignmentId: assignmentId ?? null,
  component: normaliseComponent(component),
  timeWindow: {
    start: null,
    end: null,
  },
  cohort: {
    avgScore: 0,
    medianScore: 0,
    stdDev: 0,
    highScoreRate: 0,
    lowScoreRate: 0,
  },
  examiners: [],
  outliers: {
    highScoreExaminerIds: [],
    lowScoreExaminerIds: [],
    highVarianceExaminerIds: [],
  },
});

const buildTimeseriesDefault = (interval = "DAY") => ({
  interval,
  series: [],
  baseline: [],
});

const buildDistributionDefault = () => ({
  points: [],
});

const buildOutlierListDefault = () => [];

const normaliseTimeWindow = (payloadWindow) => {
  if (!payloadWindow || typeof payloadWindow !== "object") {
    return { start: null, end: null };
  }
  return {
    start:
      payloadWindow.start ??
      payloadWindow.from ??
      payloadWindow.begin ??
      payloadWindow.windowStart ??
      null,
    end:
      payloadWindow.end ??
      payloadWindow.to ??
      payloadWindow.finish ??
      payloadWindow.windowEnd ??
      null,
  };
};

const normaliseCohort = (cohort) => ({
  avgScore: toNumber(cohort?.avgScore, 0),
  medianScore: toNumber(cohort?.medianScore, 0),
  stdDev: toNumber(cohort?.stdDev ?? cohort?.standardDeviation, 0),
  highScoreRate: clampRatio(cohort?.highScoreRate),
  lowScoreRate: clampRatio(cohort?.lowScoreRate),
});

const normaliseExaminerOverview = (entry) => ({
  examinerId: entry?.examinerId ?? entry?.id ?? null,
  examinerName: entry?.examinerName ?? entry?.name ?? "",
  submissionCount: toNumber(entry?.submissionCount ?? entry?.samples, 0),
  avgScore: toNumber(entry?.avgScore ?? entry?.averageScore, 0),
  medianScore: toNumber(entry?.medianScore, 0),
  stdDev: toNumber(entry?.stdDev ?? entry?.variance ?? entry?.standardDeviation, 0),
  relativeDelta: toNumber(entry?.relativeDelta ?? entry?.deltaFromCohort, 0),
  highScoreRate: clampRatio(entry?.highScoreRate),
  lowScoreRate: clampRatio(entry?.lowScoreRate),
  reopenedCount: toNumber(entry?.reopenedCount, 0),
  draftCount: toNumber(entry?.draftCount, 0),
  commentCount: toNumber(entry?.commentCount, 0),
  lastSubmissionAt:
    entry?.lastSubmissionAt ?? entry?.lastMarkedAt ?? entry?.lastUpdatedAt ?? null,
});

const normaliseOverviewOutliers = (outliers) => ({
  highScoreExaminerIds: Array.isArray(outliers?.highScoreExaminerIds)
    ? outliers.highScoreExaminerIds
    : [],
  lowScoreExaminerIds: Array.isArray(outliers?.lowScoreExaminerIds)
    ? outliers.lowScoreExaminerIds
    : [],
  highVarianceExaminerIds: Array.isArray(outliers?.highVarianceExaminerIds)
    ? outliers.highVarianceExaminerIds
    : [],
});

const normaliseTimeseriesPoint = (point) => ({
  bucketStart:
    point?.bucketStart ??
    point?.start ??
    point?.from ??
    point?.date ??
    point?.timestamp ??
    null,
  bucketEnd:
    point?.bucketEnd ??
    point?.end ??
    point?.to ??
    point?.date ??
    point?.timestamp ??
    null,
  submissionCount: toNumber(point?.submissionCount ?? point?.samples, 0),
  avgScore: toNumber(point?.avgScore ?? point?.averageScore, 0),
  medianScore: toNumber(point?.medianScore, 0),
  highScoreRate: clampRatio(point?.highScoreRate),
  lowScoreRate: clampRatio(point?.lowScoreRate),
});

const normaliseTimeseriesSeries = (series) => ({
  examinerId: series?.examinerId ?? series?.id ?? null,
  examinerName: series?.examinerName ?? series?.name ?? "",
  points: Array.isArray(series?.points)
    ? series.points.map(normaliseTimeseriesPoint)
    : [],
});

const normaliseBaselinePoint = (point) => ({
  bucketStart:
    point?.bucketStart ??
    point?.start ??
    point?.from ??
    point?.date ??
    point?.timestamp ??
    null,
  bucketEnd:
    point?.bucketEnd ?? point?.end ?? point?.to ?? point?.date ?? point?.timestamp ?? null,
  avgScore: toNumber(point?.avgScore ?? point?.averageScore, 0),
});

const normaliseDistributionPoint = (point) => ({
  examinerId: point?.examinerId ?? point?.id ?? null,
  examinerName: point?.examinerName ?? point?.name ?? "",
  avgScore: toNumber(point?.avgScore ?? point?.averageScore, 0),
  stdDev: toNumber(point?.stdDev ?? point?.standardDeviation ?? point?.variance, 0),
  submissionCount: toNumber(point?.submissionCount ?? point?.samples, 0),
  highScoreRate: clampRatio(point?.highScoreRate),
  lowScoreRate: clampRatio(point?.lowScoreRate),
  reopenedCount: toNumber(point?.reopenedCount, 0),
  draftCount: toNumber(point?.draftCount, 0),
  commentCount: toNumber(point?.commentCount, 0),
});

const normaliseOutlierEntry = (entry) => ({
  sessionId: entry?.sessionId ?? null,
  participantType: entry?.participantType ?? entry?.type ?? null,
  participantId:
    entry?.participantId ?? entry?.groupId ?? entry?.studentId ?? entry?.entityId ?? null,
  participantName:
    entry?.participantName ??
    entry?.groupName ??
    entry?.studentName ??
    entry?.entityName ??
    "",
  score: toNumber(entry?.score ?? entry?.totalScore, 0),
  cohortDelta: toNumber(entry?.cohortDelta ?? entry?.deltaFromCohort, 0),
  category: entry?.category ?? entry?.outlierType ?? "UNKNOWN",
  examinerId: entry?.examinerId ?? null,
  examinerName: entry?.examinerName ?? "",
  markedAt: entry?.markedAt ?? entry?.submittedAt ?? null,
});

const adminExaminerTrendReportServiceReal = {
  async getOverview(assignmentId, params = {}) {
    const response = await apiClient.get(
      `/api/admin/reports/examiners/${assignmentId}/overview`,
      { params }
    );
    const payload = extract(response);
    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        data: buildOverviewDefault(assignmentId, params.component),
      };
    }
    const component = normaliseComponent(payload.component ?? params.component);
    return {
      success: Boolean(response?.data?.success ?? true),
      data: {
        assignmentId: payload.assignmentId ?? assignmentId ?? null,
        component,
        timeWindow: normaliseTimeWindow(payload.timeWindow),
        cohort: normaliseCohort(payload.cohort ?? {}),
        examiners: Array.isArray(payload.examiners)
          ? payload.examiners.map(normaliseExaminerOverview)
          : [],
        outliers: normaliseOverviewOutliers(payload.outliers ?? {}),
      },
    };
  },

  async getTimeseries(assignmentId, params = {}) {
    const response = await apiClient.get(
      `/api/admin/reports/examiners/${assignmentId}/timeseries`,
      { params }
    );
    const payload = extract(response);
    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        data: buildTimeseriesDefault(params.interval),
      };
    }
    const interval = (payload.interval || params.interval || "DAY").toString().toUpperCase();
    return {
      success: Boolean(response?.data?.success ?? true),
      data: {
        interval,
        series: Array.isArray(payload.series)
          ? payload.series.map(normaliseTimeseriesSeries)
          : [],
        baseline: Array.isArray(payload.baseline)
          ? payload.baseline.map(normaliseBaselinePoint)
          : [],
      },
    };
  },

  async getDistribution(assignmentId, params = {}) {
    const response = await apiClient.get(
      `/api/admin/reports/examiners/${assignmentId}/distribution`,
      { params }
    );
    const payload = extract(response);
    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        data: buildDistributionDefault(),
      };
    }
    const pointsSource = payload.points ?? payload.examiners ?? [];
    return {
      success: Boolean(response?.data?.success ?? true),
      data: {
        assignmentId: payload.assignmentId ?? assignmentId ?? null,
        component: normaliseComponent(payload.component ?? params.component),
        points: Array.isArray(pointsSource)
          ? pointsSource.map(normaliseDistributionPoint)
          : [],
      },
    };
  },

  async getOutlierSessions(assignmentId, params = {}) {
    const response = await apiClient.get(
      `/api/admin/reports/examiners/${assignmentId}/outlier-sessions`,
      { params }
    );
    const payload = extract(response);
    if (!payload) {
      return {
        success: false,
        data: buildOutlierListDefault(),
      };
    }
    const list = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    return {
      success: Boolean(response?.data?.success ?? true),
      data: list.map(normaliseOutlierEntry),
    };
  },

  buildDefaults(assignmentId, component) {
    return {
      overview: buildOverviewDefault(assignmentId, component),
      timeseries: buildTimeseriesDefault(),
      distribution: buildDistributionDefault(),
      outliers: buildOutlierListDefault(),
    };
  },
};

export default adminExaminerTrendReportServiceReal;
