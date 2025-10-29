"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import useAdminAssignments from "@/hooks/admin/useAdminAssignments.js";
import { useExaminerTrendSummary } from "@/hooks/admin/useExaminerTrendReportData.js";
import ReportsLayout from "@/components/admin/reports/ReportsLayout.jsx";
import ExaminerTrendSummaryBanner from "@/components/admin/reports/examiner-trends/ExaminerTrendSummaryBanner.jsx";
import ExaminerTrendTable from "@/components/admin/reports/examiner-trends/ExaminerTrendTable.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useExaminerTrendReportStore } from "@/store/examinerTrendReportStore.js";

const STATUS_OPTIONS = [
  { id: "SUBMITTED", label: "Submitted only" },
  { id: "ALL", label: "Submitted + Draft" },
];

const DELTA_THRESHOLD = 5;

const AssignmentSelect = ({ assignments, value, onChange, disabled }) => (
  <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger className="w-full max-w-[24rem]">
      <SelectValue placeholder={disabled ? "Loading assignments..." : "Select assignment"} />
    </SelectTrigger>
    <SelectContent className="max-h-72">
      {assignments.map((assignment) => {
        const id = String(assignment.id ?? assignment.assignmentId);
        const name = assignment.name || assignment.assignmentName || assignment.title || `Assignment ${id}`;
        const courseLabel = assignment.courseCode || assignment.courseName || assignment.subjectCode || "Course";
        return (
          <SelectItem key={id} value={id}>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{name}</span>
              <span className="text-xs text-gray-500">{courseLabel}</span>
            </div>
          </SelectItem>
        );
      })}
    </SelectContent>
  </Select>
);

const StatusSelect = ({ value, onChange }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full max-w-[16rem]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {STATUS_OPTIONS.map((option) => (
        <SelectItem key={option.id} value={option.id}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const ControlBar = ({
  assignments,
  loading,
  assignmentId,
  onAssignmentChange,
  status,
  onStatusChange,
  minSessions,
  onMinSessionsChange,
  onRefresh,
}) => (
  <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
      <div className="space-y-1 md:w-auto">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assignment</p>
        <AssignmentSelect
          assignments={assignments}
          value={assignmentId}
          onChange={onAssignmentChange}
          disabled={loading || assignments.length === 0}
        />
      </div>
      <div className="space-y-1 md:w-auto">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
        <StatusSelect value={status} onChange={onStatusChange} />
      </div>
      <div className="space-y-1 md:w-40">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Min sessions</p>
        <Input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={minSessions}
          onChange={(event) => onMinSessionsChange(event.target.value.replace(/[^0-9]/g, ""))}
          className="w-full"
        />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={onRefresh} disabled={loading || !assignmentId}>
        <i className="fas fa-rotate-right mr-2" /> Refresh
      </Button>
      <Button asChild variant="ghost" className="text-blue-600 hover:text-blue-500">
        <Link href="/admin/results">
          <i className="fas fa-arrow-up-right-from-square mr-2" /> Open Results Hub
        </Link>
      </Button>
    </div>
  </div>
);

function ExaminerTrendReportContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const adminId = user?.id;

  const {
    assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
    warnings,
    refresh: refreshAssignments,
  } = useAdminAssignments(adminId, { enabled: Boolean(adminId) });

  const {
    assignmentId,
    setAssignmentId,
    status,
    setStatus,
    minSessions,
    setMinSessions,
    sortBy,
    sortDirection,
    setSort,
  } = useExaminerTrendReportStore();

  const [isInitialised, setIsInitialised] = useState(false);

  // Bootstrap from URL
  useEffect(() => {
    if (isInitialised) return;
    const urlAssignmentId = searchParams.get("assignmentId");
    const urlStatus = searchParams.get("status");
    const urlMinSessions = searchParams.get("minSessions");

    if (urlAssignmentId) {
      setAssignmentId(String(urlAssignmentId));
    }
    if (urlStatus) {
      setStatus(urlStatus.toUpperCase());
    }
    if (urlMinSessions) {
      setMinSessions(urlMinSessions);
    }
    setIsInitialised(true);
  }, [isInitialised, searchParams, setAssignmentId, setStatus, setMinSessions]);

  // Auto select first assignment once loaded
  useEffect(() => {
    if (!isInitialised) return;
    if (!assignmentId && assignments && assignments.length > 0) {
      const first = assignments[0];
      const firstId = String(first.id ?? first.assignmentId);
      setAssignmentId(firstId);
      updateUrl(router, pathname, { assignmentId: firstId, status, minSessions });
    }
  }, [assignments, assignmentId, isInitialised, router, pathname, setAssignmentId, status, minSessions]);

  const selectedAssignment = useMemo(() => {
    if (!assignments || assignments.length === 0 || !assignmentId) return null;
    return assignments.find((assignment) => String(assignment.id ?? assignment.assignmentId) === String(assignmentId)) ?? null;
  }, [assignments, assignmentId]);

  const numericMinSessions = useMemo(() => {
    const parsed = Number(minSessions);
    if (Number.isNaN(parsed) || parsed <= 0) return undefined;
    return parsed;
  }, [minSessions]);

  const summaryQuery = useExaminerTrendSummary(
    assignmentId,
    {
      status: status || undefined,
      minSessions: numericMinSessions,
    },
    {
      enabled: Boolean(assignmentId),
      staleTime: 30 * 1000,
    }
  );

  const deviationCount = useMemo(() => {
    const rows = summaryQuery.data?.examiners ?? [];
    return rows.filter((row) => {
      if (row.delta === null || row.delta === undefined) return false;
      return Math.abs(row.delta) >= DELTA_THRESHOLD;
    }).length;
  }, [summaryQuery.data]);

  const onAssignmentChange = (value) => {
    setAssignmentId(value);
    updateUrl(router, pathname, { assignmentId: value, status, minSessions });
    summaryQuery.refetch?.();
  };

  const onStatusChange = (value) => {
    setStatus(value);
    updateUrl(router, pathname, { assignmentId, status: value, minSessions });
    summaryQuery.refetch?.();
  };

  const onMinSessionsChange = (value) => {
    const next = value;
    setMinSessions(next);
    updateUrl(router, pathname, { assignmentId, status, minSessions: next });
  };

  const onRetry = () => {
    summaryQuery.refetch?.();
  };

  const onRowClick = (row) => {
    const courseId = selectedAssignment?.courseId ?? selectedAssignment?.subjectId;
    if (!courseId || !assignmentId || !row?.examinerId) {
      return;
    }
    const targetUrl = `/admin/courses/${courseId}/assignments/${assignmentId}/results?examinerId=${row.examinerId}`;
    router.push(targetUrl);
  };

  const errorMessage = summaryQuery.error?.message ?? assignmentsError ?? "";

  const warningsMessage = warnings && warnings.length > 0
    ? `Failed to load assignments for: ${warnings.join(", ")}`
    : "";

  const assignmentName = selectedAssignment?.name || selectedAssignment?.assignmentName || selectedAssignment?.title || "";

  const sortProps = {
    sortBy,
    sortDirection,
    onSortChange: setSort,
  };

  return (
    <ReportsLayout
      breadcrumb={(
        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-3 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <nav className="flex items-center gap-2" aria-label="Breadcrumb">
            <Link href="/admin" className="font-medium text-blue-600">OAS</Link>
            <i className="fas fa-chevron-right text-xs text-gray-400" />
            <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
            <i className="fas fa-chevron-right text-xs text-gray-400" />
            <Link href="/admin/reports" className="hover:text-blue-600">Reports</Link>
            <i className="fas fa-chevron-right text-xs text-gray-400" />
            <span className="font-semibold text-blue-600">Examiner Trends</span>
          </nav>
        </div>
      )}
      hero={(
        <ExaminerTrendSummaryBanner
          summary={summaryQuery.data}
          loading={summaryQuery.isLoading || summaryQuery.isFetching}
          deviationCount={deviationCount}
          status={status}
          threshold={DELTA_THRESHOLD}
        />
      )}
      controlBar={(
        <ControlBar
          assignments={assignments}
          loading={assignmentsLoading}
          assignmentId={assignmentId}
          onAssignmentChange={onAssignmentChange}
          status={status}
          onStatusChange={onStatusChange}
          minSessions={minSessions}
          onMinSessionsChange={onMinSessionsChange}
          onRefresh={() => {
            summaryQuery.refetch?.();
            refreshAssignments();
          }}
        />
      )}
    >
      {(errorMessage || warningsMessage) && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <i className="fas fa-circle-info mt-0.5" />
            <div className="space-y-1">
              {errorMessage && <p>{errorMessage}</p>}
              {warningsMessage && <p>{warningsMessage}</p>}
            </div>
          </div>
        </div>
      )}

      <ExaminerTrendTable
        rows={summaryQuery.data?.examiners ?? []}
        loading={summaryQuery.isLoading && !summaryQuery.data}
        error={summaryQuery.error?.message}
        onRetry={onRetry}
        onRowClick={onRowClick}
        assignmentName={assignmentName}
        status={status}
        hasMixedSubjects={Boolean(summaryQuery.data?.hasMixedSubjects)}
        cohortAverage={summaryQuery.data?.cohort?.averageScore ?? null}
        {...sortProps}
      />
    </ReportsLayout>
  );
}

const updateUrl = (router, pathname, { assignmentId, status, minSessions }) => {
  if (!router) return;
  const params = new URLSearchParams();
  if (assignmentId) params.set("assignmentId", assignmentId);
  if (status) params.set("status", status);
  if (minSessions && Number(minSessions) > 0) params.set("minSessions", String(minSessions));
  const query = params.toString();
  if (query) {
    router.replace(`${pathname}?${query}`, { scroll: false });
  } else {
    router.replace(pathname, { scroll: false });
  }
};

export default function ExaminerTrendReportPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
      <ExaminerTrendReportContent />
    </Suspense>
  );
}
