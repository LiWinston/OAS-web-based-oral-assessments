"use client";

import { useQuery } from "@tanstack/react-query";
import { adminResultsService } from "@/services/adminResultsService.js";

const QUERY_KEY = "admin-mark-consolidation-assessments";

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
};

const normaliseExaminerSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== "object") {
    return {
      submissionId: null,
      examinerId: null,
      examinerName: "",
      status: "UNKNOWN",
      score: null,
      submittedAt: null,
      reopenedAt: null,
    };
  }

  return {
    submissionId: snapshot.submissionId ?? null,
    examinerId: snapshot.examinerId ?? null,
    examinerName: snapshot.examinerName ?? "",
    status: (snapshot.status || "UNKNOWN").toUpperCase(),
    score: typeof snapshot.scorePct1dp === "number" ? snapshot.scorePct1dp : null,
    submittedAt: snapshot.submittedAt ?? null,
    reopenedAt: snapshot.reopenedAt ?? null,
  };
};

const deriveProgressStatus = (summary) => {
  if (!summary) return "unknown";
  if (summary.anyReopened) return "attention";
  if (summary.allSubmitted) return "ready";
  return "incomplete";
};

const pickLatestTimestamp = (current, candidate) => {
  if (!candidate) return current;
  if (!current) return candidate;
  const currentDate = new Date(current);
  const candidateDate = new Date(candidate);
  if (Number.isNaN(candidateDate.getTime())) return current;
  if (Number.isNaN(currentDate.getTime())) return candidate;
  return candidateDate.getTime() > currentDate.getTime() ? candidate : current;
};

const mapAssessment = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const assessmentInfo = item.assessment ?? {};
  const key = assessmentInfo.key ?? {};
  const groupInfo = assessmentInfo.group ?? null;
  const studentInfo = assessmentInfo.student ?? null;
  const participantType = groupInfo ? "GROUP" : "INDIVIDUAL";
  const participantName = groupInfo?.name ?? studentInfo?.name ?? `Participant ${key.entityId ?? ""}`;

  const computed = item.computed ?? {};
  const manualOverride = computed.manualOverride ?? null;

  const examinerSummary = item.examinerSummary ?? {};
  const examiners = Array.isArray(item.examiners)
    ? item.examiners.map(normaliseExaminerSnapshot)
    : [];

  const releaseStatus = (item.releaseStatus || "NOT_RELEASED").toUpperCase();

  const summary = {
    total: examinerSummary.total ?? 0,
    submitted: examinerSummary.submitted ?? 0,
    draft: examinerSummary.draft ?? 0,
    reopened: examinerSummary.reopened ?? 0,
    pending:
      examinerSummary.pending ?? Math.max((examinerSummary.total ?? 0) - (examinerSummary.submitted ?? 0), 0),
    submittedRatio: examinerSummary.submittedRatio ?? (examinerSummary.total
      ? (examinerSummary.submitted ?? 0) / examinerSummary.total
      : 0),
    allSubmitted: Boolean(examinerSummary.allSubmitted),
    anyDraft: Boolean(examinerSummary.anyDraft),
    anyReopened: Boolean(examinerSummary.anyReopened),
  };

  return {
    id: `${participantType}-${key.entityId ?? "unknown"}-${key.sessionId ?? ""}`,
    key: {
      assignmentId: key.assignmentId ?? null,
      sessionId: key.sessionId ?? null,
      submissionId: key.submissionId ?? null,
      entityId: key.entityId ?? null,
      submissionIds: Array.isArray(key.submissionIds) ? key.submissionIds : [],
    },
    participant: {
      type: participantType,
      name: participantName,
      id: key.entityId ?? null,
      memberCount: groupInfo?.memberCount ?? null,
      student: studentInfo,
      group: groupInfo,
    },
    session: item.session ?? null,
    computed: {
      averageScore: typeof computed.averageScorePct1dp === "number" ? computed.averageScorePct1dp : null,
      effectiveFinalScore:
        typeof computed.effectiveFinalScorePct1dp === "number" ? computed.effectiveFinalScorePct1dp : null,
      manualOverride,
    },
    releaseStatus,
    examinerSummary: summary,
    examiners,
    lastSubmittedAt: item.lastSubmittedAt ?? null,
    lastUpdatedAt: item.lastUpdatedAt ?? null,
    progressStatus: deriveProgressStatus(summary),
  };
};

const computeAggregateSummary = (items) => {
  const initial = {
    total: 0,
    release: { released: 0, notReleased: 0 },
    progress: { ready: 0, attention: 0, incomplete: 0 },
    manualOverrides: 0,
    examinerTotals: { total: 0, submitted: 0, draft: 0, reopened: 0, pending: 0 },
    finalScoreSum: 0,
    finalScoreCount: 0,
    averageFinalScore: null,
    lastUpdatedAt: null,
  };

  const summary = items.reduce((acc, item) => {
    acc.total += 1;

    if (item.releaseStatus === "RELEASED") {
      acc.release.released += 1;
    } else {
      acc.release.notReleased += 1;
    }

    if (item.progressStatus === "ready") {
      acc.progress.ready += 1;
    } else if (item.progressStatus === "attention") {
      acc.progress.attention += 1;
    } else {
      acc.progress.incomplete += 1;
    }

    if (item.computed?.manualOverride) {
      acc.manualOverrides += 1;
    }

    if (typeof item.computed?.effectiveFinalScore === "number") {
      acc.finalScoreSum += item.computed.effectiveFinalScore;
      acc.finalScoreCount += 1;
    }

    if (item.examinerSummary) {
      acc.examinerTotals.total += item.examinerSummary.total ?? 0;
      acc.examinerTotals.submitted += item.examinerSummary.submitted ?? 0;
      acc.examinerTotals.draft += item.examinerSummary.draft ?? 0;
      acc.examinerTotals.reopened += item.examinerSummary.reopened ?? 0;
      acc.examinerTotals.pending += item.examinerSummary.pending ?? 0;
    }

    acc.lastUpdatedAt = pickLatestTimestamp(
      acc.lastUpdatedAt,
      pickLatestTimestamp(item.lastUpdatedAt, item.lastSubmittedAt)
    );

    return acc;
  }, initial);

  summary.averageFinalScore = summary.finalScoreCount > 0
    ? summary.finalScoreSum / summary.finalScoreCount
    : null;

  return summary;
};

const normaliseAssessmentsResponse = (response) => {
  const root = response?.data ?? response;
  const page = root?.data ?? root;

  const rawItems = Array.isArray(page?.items)
    ? page.items
    : Array.isArray(page?.assessments)
      ? page.assessments
      : [];

  const items = rawItems
    .map(mapAssessment)
    .filter(Boolean);

  const aggregate = computeAggregateSummary(items);

  return {
    items,
    total: page?.total ?? items.length,
    pageNum: page?.pageNum ?? 1,
    pageSize: page?.pageSize ?? items.length,
    summary: aggregate,
  };
};

export function useMarkConsolidationAssessments(subjectId, assignmentId, params = {}, options = {}) {
  const { enabled = true } = options;

  const releaseStatus = params.releaseStatus ?? "all";
  const progress = params.progress ?? "all";
  const sessionFilter = params.sessionId ?? undefined;
  const search = params.q ?? "";

  const requestParams = {
    pageNum: params.pageNum ?? 1,
    pageSize: params.pageSize ?? 200,
    includeAll: params.includeAll ?? true,
    releaseStatus,
    progress,
    sessionId: sessionFilter,
    q: search,
  };

  const queryKey = [
    QUERY_KEY,
    subjectId,
    assignmentId,
    releaseStatus,
    progress,
    sessionFilter ?? "all",
    search?.trim() ?? "",
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const cleanParams = {
        ...requestParams,
        sessionId: toNumber(requestParams.sessionId),
      };
      if (cleanParams.sessionId === undefined) {
        delete cleanParams.sessionId;
      }
      const response = await adminResultsService.listAssessments(
        subjectId,
        assignmentId,
        cleanParams
      );
      return normaliseAssessmentsResponse(response);
    },
    enabled: Boolean(subjectId && assignmentId && enabled),
    staleTime: options.staleTime ?? 60_000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  });
}

export default useMarkConsolidationAssessments;
