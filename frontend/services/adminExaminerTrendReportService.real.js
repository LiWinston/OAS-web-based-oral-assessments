import apiClient from "@/services/apiClient.js";

const DEFAULT_STATUS = "SUBMITTED";

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

const normaliseStatus = (status) => {
  if (!status || typeof status !== "string") return DEFAULT_STATUS;
  return status.toUpperCase();
};

const buildSummaryDefault = (assignmentId) => ({
  assignmentId: assignmentId ?? null,
  status: DEFAULT_STATUS,
  cohort: {
    examinerCount: 0,
    submissionCount: 0,
    sessionCount: 0,
    averageScore: 0,
  },
  extremes: {
    highest: null,
    lowest: null,
  },
  examiners: [],
  subjectTypes: [],
  hasMixedSubjects: false,
});

const normaliseExtremesEntry = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  return {
    examinerId: entry.examinerId ?? entry.id ?? null,
    examinerName: entry.examinerName ?? entry.name ?? "",
    averageScore: toNumber(entry.averageScore ?? entry.avgScore, 0),
  };
};

const normaliseExaminer = (entry, cohortAverage) => ({
  examinerId: entry?.examinerId ?? entry?.id ?? null,
  examinerName: entry?.examinerName ?? entry?.name ?? "",
  examinerEmail: entry?.examinerEmail ?? entry?.email ?? null,
  sessionCount: toNumber(entry?.sessionCount ?? entry?.sessions ?? entry?.session_count, 0),
  submissionCount: toNumber(entry?.submissionCount ?? entry?.sessions ?? entry?.samples, 0),
  averageScore: toNumber(entry?.averageScore ?? entry?.avgScore, 0),
  delta: toNumber(entry?.delta ?? (entry?.averageScore ?? 0) - (cohortAverage ?? 0), 0),
  cohortAverage: toNumber(cohortAverage, 0),
});

const normaliseSummary = (payload, assignmentId) => {
  if (!payload || typeof payload !== "object") {
    return buildSummaryDefault(assignmentId);
  }

  const cohortAverage = toNumber(payload?.cohort?.averageScore, 0);
  const examiners = Array.isArray(payload?.examiners)
    ? payload.examiners.map((examiner) => normaliseExaminer(examiner, cohortAverage))
    : [];

  const subjectTypesRaw = Array.isArray(payload?.subjectTypes)
    ? payload.subjectTypes
    : payload?.subjectType
      ? [payload.subjectType]
      : [];

  const subjectTypes = subjectTypesRaw
    .map((type) => (typeof type === "string" ? type.toUpperCase() : null))
    .filter((type, index, list) => type && list.indexOf(type) === index);

  const hasMixedSubjects = Boolean(
    payload?.hasMixedSubjects ||
      subjectTypes.includes("MIX") ||
      subjectTypes.length > 1
  );

  return {
    assignmentId: payload.assignmentId ?? assignmentId ?? null,
    status: normaliseStatus(payload.status),
    cohort: {
      examinerCount: toNumber(payload?.cohort?.examinerCount, examiners.length),
      submissionCount: toNumber(payload?.cohort?.submissionCount, 0),
      sessionCount: toNumber(payload?.cohort?.sessionCount, 0),
      averageScore: cohortAverage,
    },
    extremes: {
      highest: normaliseExtremesEntry(payload?.extremes?.highest),
      lowest: normaliseExtremesEntry(payload?.extremes?.lowest),
    },
    examiners,
    subjectTypes,
    hasMixedSubjects,
  };
};

const adminExaminerTrendReportServiceReal = {
  async getSummary(assignmentId, params = {}) {
    if (!assignmentId) {
      return { success: false, data: buildSummaryDefault(null) };
    }

    const response = await apiClient.get(
      `/api/admin/reports/examiners/${assignmentId}/summary`,
      { params }
    );

    const payload = extract(response);
    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        data: buildSummaryDefault(assignmentId),
      };
    }

    return {
      success: Boolean(response?.data?.success ?? true),
      data: normaliseSummary(payload, assignmentId),
    };
  },

  buildSummaryDefault,
};

export default adminExaminerTrendReportServiceReal;
