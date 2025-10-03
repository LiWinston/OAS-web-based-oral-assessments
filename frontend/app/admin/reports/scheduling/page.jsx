"use client";

import { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import useAdminAssignments from "@/hooks/admin/useAdminAssignments.js";
import ReportsLayout from "@/components/admin/reports/ReportsLayout.jsx";
import SchedulingCalendarHeatmap from "@/components/admin/reports/SchedulingCalendarHeatmap.jsx";
import SchedulingSummaryStrip from "@/components/admin/reports/SchedulingSummaryStrip.jsx";
import SchedulingInsightRail from "@/components/admin/reports/SchedulingInsightRail.jsx";
import SchedulingSessionsTable from "@/components/admin/reports/SchedulingSessionsTable.jsx";
import SchedulingDetailDrawer from "@/components/admin/reports/SchedulingDetailDrawer.jsx";
import {
  useSchedulingAssignmentMeta,
  useSchedulingCalendar,
  useSchedulingPublishStatus,
  useSchedulingSessions,
} from "@/hooks/admin/useSchedulingReportData.js";
import {
  useSchedulingReportStore,
} from "@/store/schedulingReportStore.js";

const formatMonthKey = (value) => {
  if (!value) return "";
  if (value.length === 7 && value.includes("-")) return value;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  } catch (error) {
    return "";
  }
};

const toDateKey = (value) => {
  if (!value) return "";
  if (value.length === 10 && value.includes("-")) return value;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (error) {
    return value;
  }
};

const toMonthKeyFromDateKey = (dateKey) => {
  if (!dateKey || dateKey.length < 7) return "";
  return dateKey.slice(0, 7);
};

const addDays = (base, days) => {
  if (!base) return null;
  const clone = new Date(base.getTime());
  clone.setDate(clone.getDate() + days);
  return clone;
};

const toDateObject = (value) => {
  const key = toDateKey(value);
  if (!key || key.length !== 10) return null;
  const [year, month, day] = key.split("-").map(Number);
  if ([year, month, day].some(Number.isNaN)) return null;
  return new Date(year, month - 1, day);
};

const statusOptions = [
  { id: "all", label: "All" },
  { id: "fully", label: "Fully Staffed" },
  { id: "partial", label: "Partially" },
  { id: "none", label: "Unstaffed" },
];

const matchesSearch = (session, value) => {
  if (!value) return true;
  const term = value.trim().toLowerCase();
  if (!term) return true;
  const venue = session.venueName?.toLowerCase() || "";
  const examinerMatches = (session.assignedExaminers || []).some((examiner) => examiner.name?.toLowerCase().includes(term));
  const studentMatches = (session.enrolledStudents || []).some((student) => student.name?.toLowerCase().includes(term));
  const groupMatches = (session.enrolledGroups || []).some((group) => (group.name || group.groupName || "").toLowerCase().includes(term));
  return venue.includes(term) || examinerMatches || studentMatches || groupMatches;
};

const buildShareUrl = ({ assignmentId, date, status, venue }) => {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams();
  if (assignmentId) params.set("assignmentId", assignmentId);
  if (date) params.set("date", date);
  if (status && status !== "all") params.set("status", status);
  if (venue && venue !== "all") params.set("venue", venue);
  return `${window.location.origin}/admin/reports/scheduling?${params.toString()}`;
};

const exportCsv = (assignmentId, sessions) => {
  if (!sessions || sessions.length === 0) {
    return;
  }

  const header = [
    "assignmentId",
    "sessionId",
    "date",
    "startTime",
    "endTime",
    "venueName",
    "requiredExaminers",
    "assignedExaminerNames",
    "bookedCount",
    "capacity",
    "remainingCapacity",
    "publishedToExaminer",
    "publishedToStudent",
    "staffingStatus",
  ];

  const escape = (value) => {
    if (value === undefined || value === null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes("\"")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = sessions.map((session) => {
    const examinerNames = (session.assignedExaminers || []).map((examiner) => examiner.name).join("; ");
    return [
      assignmentId,
      session.id,
      session.date,
      session.startTime,
      session.endTime,
      session.venueName,
      session.requiredExaminers,
      examinerNames,
      session.bookedCount ?? 0,
      session.capacity ?? 0,
      session.remainingCapacity ?? Math.max((session.capacity ?? 0) - (session.bookedCount ?? 0), 0),
      Boolean(session.publishedToExaminer),
      Boolean(session.publishedToStudent),
      session.staffingStatus,
    ].map(escape).join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `scheduling-overview-${assignmentId}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function SchedulingOverviewReportPage() {
  const { user } = useAuthStore();
  const adminId = user?.id;

  const { assignments } = useAdminAssignments(adminId, { enabled: Boolean(adminId) });

  const {
    assignmentId,
    selectedDate,
    selectedMonth,
    statusFilter,
    venueFilter,
    searchTerm,
    viewMode,
    presetRange,
    activeSession,
    lastRefreshedAt,
    setAssignmentId,
    setSelectedDate,
    setSelectedMonth,
    setStatusFilter,
    setVenueFilter,
    setSearchTerm,
    setViewMode,
    setPresetRange,
    setActiveSession,
    closeDrawer,
    touchRefreshed,
    resetFilters,
  } = useSchedulingReportStore();

  // Default assignment selection
  useEffect(() => {
    if (!assignments || assignments.length === 0) return;
    if (!assignmentId) {
      setAssignmentId(String(assignments[0].id));
    }
  }, [assignments, assignmentId, setAssignmentId]);

  const calendarQuery = useSchedulingCalendar(assignmentId, selectedMonth, {
    enabled: Boolean(assignmentId && selectedMonth),
  });

  const assignmentMetaQuery = useSchedulingAssignmentMeta(assignmentId, {
    enabled: Boolean(assignmentId),
  });

  const publishStatusQuery = useSchedulingPublishStatus(assignmentId, {
    enabled: Boolean(assignmentId),
  });

  const calendarData = calendarQuery.data || {};
  const calendarDates = useMemo(() => Object.keys(calendarData).sort(), [calendarData]);
  const assignmentMeta = assignmentMetaQuery.data;

  useEffect(() => {
    if (!assignmentId) return;
    if (selectedMonth) return;

    const windowStartKey = toDateKey(assignmentMeta?.windowStart);
    const now = new Date();
    const fallbackMonth = windowStartKey
      ? toMonthKeyFromDateKey(windowStartKey)
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (fallbackMonth) {
      setSelectedMonth(fallbackMonth);
    }
  }, [assignmentId, assignmentMeta?.windowStart, selectedMonth, setSelectedMonth]);

  const sessionParams = useMemo(() => {
    return {
      date: selectedDate,
      status: statusFilter !== "all" ? statusFilter : undefined,
      venueId: venueFilter !== "all" ? venueFilter : undefined,
      q: searchTerm,
    };
  }, [selectedDate, statusFilter, venueFilter, searchTerm]);

  const sessionsQuery = useSchedulingSessions(assignmentId, sessionParams, {
    enabled: Boolean(assignmentId && selectedDate),
    allowEmptyDate: false,
  });

  // Initialize selected date when calendar data arrives or context changes
  useEffect(() => {
    if (!assignmentId) return;
    if (!calendarDates.length) return;

    if (selectedDate && calendarData[selectedDate]) return;

    const monthPrefix = selectedMonth ? `${selectedMonth}-` : null;
    const windowStartKey = toDateKey(assignmentMeta?.windowStart);
    const windowEndKey = toDateKey(assignmentMeta?.windowEnd);
    const todayKey = toDateKey(new Date());

    const candidateInMonth = monthPrefix
      ? calendarDates.find((date) => date.startsWith(monthPrefix))
      : null;

    let target = candidateInMonth;

    if (!target && windowStartKey) {
      target = calendarDates.find((date) => {
        if (windowEndKey) {
          return date >= windowStartKey && date <= windowEndKey;
        }
        return date >= windowStartKey;
      });
    }

    if (!target) {
      target = calendarDates.find((date) => date >= todayKey);
    }

    if (!target) {
      target = calendarDates[0];
    }

    if (target) {
      setSelectedDate(target);
    }
  }, [
    assignmentId,
    assignmentMeta?.windowEnd,
    assignmentMeta?.windowStart,
    calendarData,
    calendarDates,
    selectedDate,
    selectedMonth,
    setSelectedDate,
  ]);

  useEffect(() => {
    if (!sessionsQuery.data) return;
    touchRefreshed();
  }, [sessionsQuery.dataUpdatedAt, touchRefreshed, sessionsQuery.data]);

  const sessions = useMemo(
    () => sessionsQuery.data?.sessions ?? [],
    [sessionsQuery.data]
  );

  const summary = sessionsQuery.data?.summary || null;

  const venueOptions = useMemo(() => {
    const base = sessionsQuery.data?.venues || [];
    return [
      { id: "all", name: "All venues" },
      ...base.map((venue) => ({ id: String(venue.id), name: venue.name || `Venue ${venue.id}` })),
    ];
  }, [sessionsQuery.data?.venues]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const statusOk = statusFilter === "all" || session.staffingStatus === statusFilter;
      const venueOk = venueFilter === "all" || String(session.venueId) === String(venueFilter);
      const searchOk = matchesSearch(session, searchTerm);
      return statusOk && venueOk && searchOk;
    });
  }, [sessions, statusFilter, venueFilter, searchTerm]);

  const staffingGaps = (summary?.unstaffed || summary?.noStaffed || 0) + (summary?.partiallyStaffed || 0);

  const pressureInsight = useMemo(() => {
    if (!filteredSessions || filteredSessions.length === 0) return null;
    let top = null;
    filteredSessions.forEach((session) => {
      const capacity = session.capacity || 0;
      if (capacity === 0) return;
      const ratio = (session.bookedCount || 0) / capacity;
      if (!top || ratio > top.ratio) {
        top = {
          session,
          ratio,
        };
      }
    });
    return top;
  }, [filteredSessions]);

  const insights = useMemo(() => {
    const list = [];
    if (staffingGaps > 0) {
      list.push(`⚠️ ${staffingGaps} session${staffingGaps === 1 ? '' : 's'} still need examiner coverage.`);
    } else if (summary?.fullyStaffed > 0) {
      list.push('✅ All sessions fully staffed for the selected date.');
    }
    if (pressureInsight && pressureInsight.ratio >= 0.75) {
      const { session, ratio } = pressureInsight;
      list.push(`🔥 ${session.venueName} is ${Math.round(ratio * 100)}% booked. Consider opening overflow.`);
    }
    if (filteredSessions.some((session) => session.publishedToExaminer && !session.publishedToStudent)) {
      list.push('👀 Examiners can see the schedule while students are still waiting.');
    }
    return list;
  }, [filteredSessions, pressureInsight, staffingGaps, summary]);

  const handleMonthChange = useCallback((nextMonth) => {
    setSelectedMonth(formatMonthKey(nextMonth));
  }, [setSelectedMonth]);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(toDateKey(date));
  }, [setSelectedDate]);

  const handleRefresh = useCallback(() => {
    sessionsQuery.refetch();
    calendarQuery.refetch();
  }, [sessionsQuery, calendarQuery]);

  const handleShare = useCallback(() => {
    const shareUrl = buildShareUrl({
      assignmentId,
      date: selectedDate,
      status: statusFilter,
      venue: venueFilter,
    });
    if (!shareUrl) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {
        // Silently fail; no fallback for now
      });
    }
  }, [assignmentId, selectedDate, statusFilter, venueFilter]);

  const handlePresetChange = useCallback((nextPreset) => {
    setPresetRange(nextPreset);
    if (!assignmentId) return;

    const applySelection = (dateKey) => {
      if (!dateKey) return false;
      const monthKey = formatMonthKey(dateKey);
      if (monthKey) {
        setSelectedMonth(monthKey);
      }
      setSelectedDate(dateKey);
      return true;
    };

    const todayKey = toDateKey(new Date());
    const windowStartKey = toDateKey(assignmentMeta?.windowStart);
    const windowEndKey = toDateKey(assignmentMeta?.windowEnd);

    if (nextPreset === "today") {
      if (todayKey) {
        applySelection(todayKey);
      }
      return;
    }

    if (nextPreset === "week") {
      if (!todayKey) return;
      const endDateObj = addDays(toDateObject(todayKey), 6);
      const endKey = endDateObj ? toDateKey(endDateObj) : "";
      const candidate = calendarDates.find((date) => {
        if (!date) return false;
        if (endKey) {
          return date >= todayKey && date <= endKey;
        }
        return date >= todayKey;
      }) || calendarDates.find((date) => date >= todayKey);

      if (candidate) {
        applySelection(candidate);
      } else {
        applySelection(todayKey);
      }
      return;
    }

    if (nextPreset === "window") {
      if (windowStartKey) {
        const candidate = calendarDates.find((date) => {
          if (!date) return false;
          if (windowEndKey) {
            return date >= windowStartKey && date <= windowEndKey;
          }
          return date >= windowStartKey;
        }) || windowStartKey;

        applySelection(candidate);
      }
      return;
    }

    if (nextPreset === "custom") {
      if (typeof window !== "undefined") {
        const input = window.prompt("请输入要查看的日期 (YYYY-MM-DD)：");
        const customKey = toDateKey(input);
        if (customKey) {
          applySelection(customKey);
        }
      }
    }
  }, [
    assignmentId,
    assignmentMeta?.windowEnd,
    assignmentMeta?.windowStart,
    calendarDates,
    setPresetRange,
    setSelectedDate,
    setSelectedMonth,
  ]);

  const hero = (
    <section className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-7 text-white shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-100/80">Scheduling Overview</p>
          <h1 className="text-3xl font-semibold">Spot staffing risks before they escalate</h1>
          <p className="max-w-xl text-sm text-blue-100/80">
            Interactive heatmap, smart filters, and actionable insights help you keep exams staffed and on time. Share custom
            views instantly when collaboration is needed.
          </p>
        </div>
        <div className="grid min-w-[220px] grid-cols-2 gap-3 text-center text-sm">
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-blue-100/70">Fully staffed</div>
            <div className="text-2xl font-semibold">{summary?.fullyStaffed ?? 0}</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-blue-100/70">Gaps</div>
            <div className="text-2xl font-semibold text-amber-200">{staffingGaps}</div>
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
        <span className="font-semibold text-blue-600">Scheduling Overview</span>
      </nav>
    </div>
  );

  const controlBar = (
    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStatusFilter(option.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === option.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="venue" className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Venue</label>
            <select
              id="venue"
              value={venueFilter}
              onChange={(event) => setVenueFilter(event.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              {venueOptions.map((venue) => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search venue or examiner"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-full px-3 py-1 text-xs font-medium ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`rounded-full px-3 py-1 text-xs font-medium ${viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              Group by venue
            </button>
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
              onClick={() => exportCsv(assignmentId, filteredSessions)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <i className="fas fa-file-arrow-down mr-1" /> Export CSV
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              <i className="fas fa-link mr-1" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const selectedMeta = assignmentMeta;
  const publishStatus = publishStatusQuery.data;

  const sideRail = (
    <SchedulingInsightRail
      assignments={assignments}
      selectedAssignmentId={assignmentId}
      onSelectAssignment={(value) => {
        setAssignmentId(value);
        resetFilters();
        setSelectedDate("");
        setSelectedMonth("");
      }}
      summary={summary}
      meta={selectedMeta}
      publishStatus={publishStatus}
      lastRefreshedAt={lastRefreshedAt}
      onRefresh={handleRefresh}
      insights={insights}
    />
  );

  const calendarSection = (
    <SchedulingCalendarHeatmap
      month={selectedMonth}
      data={calendarQuery.data || {}}
      selectedDate={selectedDate}
      onChangeMonth={handleMonthChange}
      onSelectDate={handleDateSelect}
      isLoading={calendarQuery.isFetching}
    />
  );

  const summaryStrip = (
    <SchedulingSummaryStrip
      summary={summary}
      publishStatus={publishStatus}
      selectedDate={selectedDate}
      preset={presetRange}
      onPresetChange={handlePresetChange}
    />
  );

  const tableSection = (
    <SchedulingSessionsTable
      sessions={filteredSessions}
      viewMode={viewMode}
      onRowSelect={setActiveSession}
      initialSort={{ column: 'startTime', direction: 'asc' }}
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
        {summaryStrip}
        {calendarSection}
        {sessionsQuery.isError && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200">
            Failed to load sessions. Please try again.
          </div>
        )}
        {sessionsQuery.isLoading ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Loading sessions...
          </div>
        ) : (
          tableSection
        )}
      </div>
      <SchedulingDetailDrawer
        session={activeSession}
        open={Boolean(activeSession)}
        onOpenChange={(open) => {
          if (!open) closeDrawer();
        }}
      />
    </ReportsLayout>
  );
}
