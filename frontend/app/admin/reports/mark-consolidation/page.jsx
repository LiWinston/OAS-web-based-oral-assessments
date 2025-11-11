"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import useAdminAssignments from "@/hooks/admin/useAdminAssignments.js";
import { useAssignmentSessions } from "@/hooks/admin/results/useAssignmentSessions.js";
import { useMarkConsolidationAssessments } from "@/hooks/admin/useMarkConsolidationReport.js";
import { useMarkConsolidationOverview } from "@/hooks/admin/useMarkConsolidationOverview.js";
import { useMarkConsolidationTrends } from "@/hooks/admin/useMarkConsolidationTrends.js";
import { useMarkConsolidationAlerts } from "@/hooks/admin/useMarkConsolidationAlerts.js";
import { useMarkConsolidationReportStore } from "@/store/markConsolidationReportStore.js";
import ReportsLayout from "@/components/admin/reports/ReportsLayout.jsx";
import MarkConsolidationSummaryStrip from "@/components/admin/reports/mark-consolidation/MarkConsolidationSummaryStrip.jsx";
import MarkConsolidationInsightRail from "@/components/admin/reports/mark-consolidation/MarkConsolidationInsightRail.jsx";
import MarkConsolidationAssessmentsTable from "@/components/admin/reports/mark-consolidation/MarkConsolidationAssessmentsTable.jsx";
import MarkConsolidationTrendChart from "@/components/admin/reports/mark-consolidation/MarkConsolidationTrendChart.jsx";
import MarkConsolidationAlertsPanel from "@/components/admin/reports/mark-consolidation/MarkConsolidationAlertsPanel.jsx";
import ReportFilterPills from "@/components/admin/reports/ReportFilterPills.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { formatDateRangeWithTimezone } from "@/lib/datetime.js";

const releaseOptions = [
  { id: "all", label: "All" },
  { id: "released", label: "Released" },
  { id: "not_released", label: "Not released" },
];

const progressOptions = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "attention", label: "Needs attention" },
  { id: "incomplete", label: "Awaiting examiners" },
];

const trendIntervalOptions = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
];

const trendRangeOptions = [
  { id: "7", label: "Last 7 days" },
  { id: "14", label: "Last 14 days" },
  { id: "30", label: "Last 30 days" },
];

const formatNumber = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-AU").format(numeric);
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "—";
  }
};

const toNumeric = (value) => {
  if (value === null || value === undefined || value === "" || value === "all") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const computeRangeParams = (preset) => {
  const days = Number(preset);
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  if (Number.isFinite(days) && days > 0) {
    start.setDate(start.getDate() - (days - 1));
  }
  start.setHours(0, 0, 0, 0);

  const toDateKey = (date) => date.toISOString().split("T")[0];

  return {
    rangeStart: toDateKey(start),
    rangeEnd: toDateKey(end),
  };
};

function MarkConsolidationContent() {
  const { user } = useAuthStore();
  const adminId = user?.id;

  const {
    assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
    warnings,
  } = useAdminAssignments(adminId, { enabled: Boolean(adminId) });

  const {
    assignmentId,
    releaseFilter,
    progressFilter,
    sessionId,
    searchTerm,
    sortBy,
    sortDirection,
    lastRefreshedAt,
    setAssignmentId,
    setReleaseFilter,
    setProgressFilter,
    setSessionId,
    setSearchTerm,
    setSort,
    touchRefreshed,
    resetFilters,
  } = useMarkConsolidationReportStore();

  const [trendInterval, setTrendInterval] = useState("day");
  const [trendRange, setTrendRange] = useState("14");

  useEffect(() => {
    if (!assignments || assignments.length === 0) return;
    if (!assignmentId) {
      const first = assignments[0];
      const id = first?.id ?? first?.assignmentId;
      if (id) setAssignmentId(String(id));
    }
  }, [assignments, assignmentId, setAssignmentId]);

  useEffect(() => {
    // reset chart filters when assignment changes
    setTrendInterval("day");
    setTrendRange("14");
  }, [assignmentId]);

  const selectedAssignment = useMemo(() => {
    if (!assignments || assignments.length === 0 || !assignmentId) return null;
    return assignments.find((assignment) => String(assignment.id ?? assignment.assignmentId) === String(assignmentId)) ?? null;
  }, [assignments, assignmentId]);

  const assignmentNumericId = selectedAssignment?.id ?? selectedAssignment?.assignmentId ?? null;
  const courseId = selectedAssignment?.courseId
    ?? selectedAssignment?.subjectId
    ?? selectedAssignment?.course?.id
    ?? selectedAssignment?.course?.courseId
    ?? null;

  const subjectId = courseId;
  const sessionNumericId = toNumeric(sessionId);

  const sessionsQuery = useAssignmentSessions(
    subjectId,
    assignmentNumericId,
    { pageNum: 1, pageSize: 200 },
    { enabled: Boolean(subjectId && assignmentNumericId) }
  );

  const sessionOptions = useMemo(() => {
    const items = sessionsQuery.data?.items ?? [];
    const mapped = items.map((session) => ({
      value: String(session.sessionId),
      label: formatDateRangeWithTimezone(
        session.start,
        session.end,
        session.timezone || "Australia/Melbourne"
      ),
    }));
    return [{ value: "all", label: "All sessions" }, ...mapped];
  }, [sessionsQuery.data]);

  const assessmentsQuery = useMarkConsolidationAssessments(
    subjectId,
    assignmentNumericId,
    {
      releaseStatus: releaseFilter,
      progress: progressFilter,
      sessionId: sessionNumericId,
      q: searchTerm?.trim() || undefined,
    },
    { enabled: Boolean(subjectId && assignmentNumericId) }
  );

  const overviewQuery = useMarkConsolidationOverview(
    subjectId,
    assignmentNumericId,
    sessionNumericId ? { sessionId: sessionNumericId } : {},
    { enabled: Boolean(subjectId && assignmentNumericId) }
  );

  const trendParams = useMemo(() => {
    const base = computeRangeParams(trendRange);
    return {
      ...base,
      interval: trendInterval,
      ...(sessionNumericId ? { sessionId: sessionNumericId } : {}),
    };
  }, [trendInterval, trendRange, sessionNumericId]);

  const trendsQuery = useMarkConsolidationTrends(
    subjectId,
    assignmentNumericId,
    trendParams,
    { enabled: Boolean(subjectId && assignmentNumericId) }
  );

  const alertsQuery = useMarkConsolidationAlerts(
    subjectId,
    assignmentNumericId,
    {
      limit: 6,
      ...(sessionNumericId ? { sessionId: sessionNumericId } : {}),
    },
    { enabled: Boolean(subjectId && assignmentNumericId) }
  );

  useEffect(() => {
    if (assessmentsQuery.data || overviewQuery.data || alertsQuery.data || trendsQuery.data) {
      touchRefreshed();
    }
  }, [
    assessmentsQuery.dataUpdatedAt,
    assessmentsQuery.data,
    overviewQuery.dataUpdatedAt,
    overviewQuery.data,
    alertsQuery.dataUpdatedAt,
    alertsQuery.data,
    trendsQuery.dataUpdatedAt,
    trendsQuery.data,
    touchRefreshed,
  ]);

  const assessmentItems = assessmentsQuery.data?.items;
  const assessments = useMemo(() => assessmentItems ?? [], [assessmentItems]);
  const overview = overviewQuery.data ?? null;
  const trends = trendsQuery.data ?? null;
  const alerts = alertsQuery.data ?? [];

  const searchLower = searchTerm?.trim().toLowerCase() ?? "";

  const filteredAssessments = useMemo(() => {
    if (!assessments || assessments.length === 0) return [];

    return assessments.filter((assessment) => {
      if (sessionNumericId) {
        if (Number(assessment.key?.sessionId ?? NaN) !== sessionNumericId) {
          return false;
        }
      }

      if (!searchLower) return true;

      const participantName = assessment.participant?.name?.toLowerCase?.() ?? "";
      const venueName = assessment.session?.venue?.name?.toLowerCase?.() ?? "";
      const examinerMatch = assessment.examiners.some((examiner) =>
        examiner.examinerName?.toLowerCase?.().includes(searchLower)
      );

      return participantName.includes(searchLower) || venueName.includes(searchLower) || examinerMatch;
    });
  }, [assessments, sessionNumericId, searchLower]);

  const sortedAssessments = useMemo(() => {
    const list = [...filteredAssessments];
    const direction = sortDirection === "desc" ? -1 : 1;

    if (sortBy === "participant") {
      list.sort((a, b) => {
        const aName = a.participant?.name?.toLowerCase?.() ?? "";
        const bName = b.participant?.name?.toLowerCase?.() ?? "";
        return aName.localeCompare(bName) * direction;
      });
    } else if (sortBy === "session") {
      list.sort((a, b) => {
        const aStart = a.session?.start ? new Date(a.session.start).getTime() : 0;
        const bStart = b.session?.start ? new Date(b.session.start).getTime() : 0;
        return (aStart - bStart) * direction;
      });
    } else if (sortBy === "score") {
      list.sort((a, b) => {
        const aScore = a.computed?.effectiveFinalScore ?? -Infinity;
        const bScore = b.computed?.effectiveFinalScore ?? -Infinity;
        return (aScore - bScore) * direction;
      });
    }

    return list;
  }, [filteredAssessments, sortBy, sortDirection]);

  const readyCount = overview?.progress?.ready ?? 0;
  const attentionCount = overview?.progress?.needsAttention ?? overview?.progress?.attention ?? 0;
  const awaitingCount = overview?.progress?.awaiting ?? overview?.progress?.incomplete ?? 0;
  const totalParticipants = overview?.totals?.participants ?? (readyCount + attentionCount + awaitingCount);
  const manualOverrides = overview?.manualOverrides?.count ?? 0;
  const lastActivity = overview?.freshness?.lastActivityAt ?? overview?.freshness?.lastExaminerSubmissionAt ?? null;

  const hero = (
    <section className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-8 py-7 text-white shadow-lg">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">Mark Consolidation</p>
          <h1 className="text-3xl font-semibold leading-tight">
            Audit examiner progress before releasing marks
          </h1>
          <p className="text-sm text-white/80">
            Use real-time submission metrics, attention alerts, and readiness filters to confirm every participant is
            prepared for publication. Resolve reopened assessments faster and keep manual overrides visible to your team.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
              <i className="fas fa-users" />
              {formatNumber(totalParticipants)} participants
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
              <i className="fas fa-pen" />
              {formatNumber(manualOverrides)} manual overrides
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1">
              <i className="fas fa-clock-rotate-left" />
              Last update {formatDateTime(lastActivity)}
            </span>
          </div>
        </div>
        <div className="grid min-w-[240px] gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl bg-white/12 px-5 py-4">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">Ready</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-200">
              {overviewQuery.isLoading ? "—" : formatNumber(readyCount)}
            </div>
            <div className="mt-1 text-xs text-white/60">Release-ready participants</div>
          </div>
          <div className="rounded-2xl bg-white/12 px-5 py-4">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">Needs attention</div>
            <div className="mt-2 text-3xl font-semibold text-amber-200">
              {overviewQuery.isLoading ? "—" : formatNumber(attentionCount)}
            </div>
            <div className="mt-1 text-xs text-white/60">Reopened or flagged</div>
          </div>
          <div className="rounded-2xl bg-white/12 px-5 py-4">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">Awaiting examiners</div>
            <div className="mt-2 text-3xl font-semibold text-sky-200">
              {overviewQuery.isLoading ? "—" : formatNumber(awaitingCount)}
            </div>
            <div className="mt-1 text-xs text-white/60">Pending submissions</div>
          </div>
        </div>
      </div>
    </section>
  );

  const breadcrumb = (
    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-3 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        <Link href="/admin" className="font-medium text-blue-600">OAS</Link>
        <i className="fas fa-chevron-right text-xs text-gray-400" />
        <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
        <i className="fas fa-chevron-right text-xs text-gray-400" />
        <Link href="/admin/reports" className="hover:text-blue-600">Reports</Link>
        <i className="fas fa-chevron-right text-xs text-gray-400" />
        <span className="font-semibold text-blue-600">Mark Consolidation</span>
      </nav>
    </div>
  );

  const handleRefresh = useCallback(() => {
    overviewQuery.refetch();
    trendsQuery.refetch();
    alertsQuery.refetch();
    assessmentsQuery.refetch();
  }, [overviewQuery, trendsQuery, alertsQuery, assessmentsQuery]);

  const handleReset = () => {
    resetFilters();
    setTrendInterval("day");
    setTrendRange("14");
  };

  const controlBar = (
    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Release</div>
            <ReportFilterPills options={releaseOptions} value={releaseFilter} onChange={setReleaseFilter} tone="blue" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Progress</div>
            <ReportFilterPills options={progressOptions} value={progressFilter} onChange={setProgressFilter} tone="emerald" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className="w-full justify-between text-sm">
                <SelectValue placeholder="Filter by session" />
              </SelectTrigger>
              <SelectContent className="min-w-[220px]">
                {sessionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={trendRange} onValueChange={setTrendRange}>
              <SelectTrigger className="w-full justify-between text-sm">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {trendRangeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ReportFilterPills
            options={trendIntervalOptions}
            value={trendInterval}
            onChange={setTrendInterval}
            tone="indigo"
            size="xs"
          />

          <div>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search participant or examiner"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <i className="fas fa-rotate-right mr-1" /> Refresh
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <i className="fas fa-rotate-left mr-1" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const warningMessage = useMemo(() => {
    if (!warnings || warnings.length === 0) return "";
    return `Could not load assignments for: ${warnings.join(", ")}`;
  }, [warnings]);

  const sideRail = (
    <MarkConsolidationInsightRail
      assignments={assignments}
      selectedAssignmentId={assignmentId}
      onSelectAssignment={(value) => setAssignmentId(value)}
      overview={overview}
      alerts={alerts}
      lastRefreshedAt={lastRefreshedAt}
      onRefresh={handleRefresh}
      isOverviewLoading={overviewQuery.isLoading}
    />
  );

  const table = (
    <MarkConsolidationAssessmentsTable
      assessments={sortedAssessments}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSortChange={setSort}
      courseId={courseId}
      assignmentId={assignmentNumericId}
    />
  );

  return (
    <ReportsLayout
      breadcrumb={breadcrumb}
      hero={hero}
      controlBar={controlBar}
      sideRail={sideRail}
    >
      <div className="space-y-6">
        {(assignmentsError || warningMessage || assessmentsQuery.isError || overviewQuery.isError) && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-700 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
            <ul className="list-disc space-y-1 pl-5">
              {assignmentsError && <li>{assignmentsError}</li>}
              {warningMessage && <li>{warningMessage}</li>}
              {assessmentsQuery.isError && <li>Failed to load mark consolidation assessments. Please refresh.</li>}
              {overviewQuery.isError && <li>Failed to load consolidation overview. Please refresh.</li>}
            </ul>
          </div>
        )}

        <MarkConsolidationSummaryStrip overview={overview} isLoading={overviewQuery.isLoading} />

        <div className="grid gap-6 xl:grid-cols-2">
          <MarkConsolidationTrendChart trends={trends} isLoading={trendsQuery.isLoading} />
          <MarkConsolidationAlertsPanel
            alerts={alerts}
            isLoading={alertsQuery.isLoading}
            courseId={courseId}
            assignmentId={assignmentNumericId}
            timezone={selectedAssignment?.timezone || selectedAssignment?.timeZone || "Australia/Melbourne"}
          />
        </div>

        {assessmentsQuery.isLoading || assignmentsLoading ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
            Loading mark consolidation data...
          </div>
        ) : (
          table
        )}
      </div>
    </ReportsLayout>
  );
}

export default function MarkConsolidationReportPage() {
  return (
    <Suspense fallback={null}>
      <MarkConsolidationContent />
    </Suspense>
  );
}
