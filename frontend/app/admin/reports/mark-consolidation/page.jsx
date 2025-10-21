"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import useAdminAssignments from "@/hooks/admin/useAdminAssignments.js";
import { useAssignmentSessions } from "@/hooks/admin/results/useAssignmentSessions.js";
import { useMarkConsolidationAssessments } from "@/hooks/admin/useMarkConsolidationReport.js";
import { useMarkConsolidationReportStore } from "@/store/markConsolidationReportStore.js";
import ReportsLayout from "@/components/admin/reports/ReportsLayout.jsx";
import MarkConsolidationSummaryStrip from "@/components/admin/reports/mark-consolidation/MarkConsolidationSummaryStrip.jsx";
import MarkConsolidationInsightRail from "@/components/admin/reports/mark-consolidation/MarkConsolidationInsightRail.jsx";
import MarkConsolidationAssessmentsTable from "@/components/admin/reports/mark-consolidation/MarkConsolidationAssessmentsTable.jsx";
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

const escapeCsv = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\"") || /\r|\n/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

function exportToCsv(courseId, assignmentId, assessments) {
  if (!assessments || assessments.length === 0) return;

  const headers = [
    "courseId",
    "assignmentId",
    "participantType",
    "participantId",
    "participantName",
    "sessionId",
    "sessionStart",
    "sessionEnd",
    "releaseStatus",
    "progressStatus",
    "effectiveFinalScore",
    "averageScore",
    "manualOverride",
    "examinersSubmitted",
    "examinersTotal",
    "examinersReopened",
    "examinersPending",
    "lastSubmittedAt",
    "lastUpdatedAt",
    "examiners",
  ];

  const rows = assessments.map((assessment) => {
    const examinersSummary = assessment.examinerSummary ?? {};
    const examinerNames = assessment.examiners
      .map((examiner) => `${examiner.examinerName || examiner.examinerId || "Unknown"} [${examiner.status}]`)
      .join("; ");

    return [
      courseId ?? "",
      assignmentId ?? "",
      assessment.participant?.type ?? "",
      assessment.participant?.id ?? "",
      assessment.participant?.name ?? "",
      assessment.key?.sessionId ?? "",
      assessment.session?.start ?? "",
      assessment.session?.end ?? "",
      assessment.releaseStatus ?? "",
      assessment.progressStatus ?? "",
      assessment.computed?.effectiveFinalScore ?? "",
      assessment.computed?.averageScore ?? "",
      assessment.computed?.manualOverride ? "true" : "false",
      examinersSummary.submitted ?? "",
      examinersSummary.total ?? "",
      examinersSummary.reopened ?? "",
      examinersSummary.pending ?? "",
      assessment.lastSubmittedAt ?? "",
      assessment.lastUpdatedAt ?? "",
      examinerNames,
    ].map(escapeCsv).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mark-consolidation-${assignmentId ?? "assignment"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

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

  useEffect(() => {
    if (!assignments || assignments.length === 0) return;
    if (!assignmentId) {
      const first = assignments[0];
      const id = first?.id ?? first?.assignmentId;
      if (id) setAssignmentId(String(id));
    }
  }, [assignments, assignmentId, setAssignmentId]);

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

  const filters = {
    releaseStatus: releaseFilter,
    progress: progressFilter,
    sessionId: sessionId !== "all" ? sessionId : undefined,
    q: searchTerm?.trim() || undefined,
  };

  const assessmentsQuery = useMarkConsolidationAssessments(
    subjectId,
    assignmentNumericId,
    filters,
    { enabled: Boolean(subjectId && assignmentNumericId) }
  );

  useEffect(() => {
    if (assessmentsQuery.data) {
      touchRefreshed();
    }
  }, [assessmentsQuery.dataUpdatedAt, assessmentsQuery.data, touchRefreshed]);

  const assessments = assessmentsQuery.data?.items ?? [];

  const searchLower = searchTerm?.trim().toLowerCase() ?? "";

  const filteredAssessments = useMemo(() => {
    if (!assessments || assessments.length === 0) return [];
    return assessments.filter((assessment) => {
      if (sessionId && sessionId !== "all") {
        if (String(assessment.key?.sessionId ?? "") !== String(sessionId)) {
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
  }, [assessments, sessionId, searchLower]);

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

  const summary = assessmentsQuery.data?.summary ?? {
    total: 0,
    release: { released: 0, notReleased: 0 },
    progress: { ready: 0, attention: 0, incomplete: 0 },
    manualOverrides: 0,
    examinerTotals: { total: 0, submitted: 0, reopened: 0, draft: 0, pending: 0 },
    averageFinalScore: null,
    lastUpdatedAt: null,
  };

  const hero = (
    <section className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-8 py-7 text-white shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">Mark Consolidation</p>
          <h1 className="text-3xl font-semibold">Monitor examiner progress before releasing marks</h1>
          <p className="max-w-2xl text-sm text-white/80">
            Track examiner submissions, spot reopened assessments, and confirm readiness before publishing results. Export
            the latest consolidation snapshot for moderation or audit purposes.
          </p>
        </div>
        <div className="grid min-w-[220px] grid-cols-2 gap-3 text-center text-sm">
          <div className="rounded-2xl bg-white/15 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-white/70">Ready</div>
            <div className="text-2xl font-semibold">{summary.progress?.ready ?? 0}</div>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-white/70">Attention</div>
            <div className="text-2xl font-semibold text-amber-200">{summary.progress?.attention ?? 0}</div>
          </div>
        </div>
      </div>
    </section>
  );

  const breadcrumb = (
    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-3 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
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

  const handleRefresh = () => {
    assessmentsQuery.refetch();
  };

  const handleExport = () => {
    exportToCsv(courseId, assignmentNumericId, sortedAssessments);
  };

  const controlBar = (
    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {releaseOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setReleaseFilter(option.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                releaseFilter === option.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {progressOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setProgressFilter(option.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  progressFilter === option.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

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
              onClick={handleExport}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <i className="fas fa-file-arrow-down mr-1" /> Export CSV
            </button>
            <button
              type="button"
              onClick={resetFilters}
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
      onSelectAssignment={(value) => {
        setAssignmentId(value);
      }}
      summary={summary}
      lastRefreshedAt={lastRefreshedAt}
      onRefresh={handleRefresh}
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
        {(assignmentsError || warningMessage || assessmentsQuery.isError) && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
            <ul className="list-disc space-y-1 pl-5">
              {assignmentsError && <li>{assignmentsError}</li>}
              {warningMessage && <li>{warningMessage}</li>}
              {assessmentsQuery.isError && <li>Failed to load mark consolidation data. Please refresh.</li>}
            </ul>
          </div>
        )}

        <MarkConsolidationSummaryStrip summary={summary} />

        {assessmentsQuery.isLoading || assignmentsLoading ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
