"use client";

import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssignmentSessions } from "@/hooks/admin/results/useAssignmentSessions.js";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";

const PAGE_SIZE = 10;

const formatDateRange = (startISO, endISO, timezone) => {
  if (!startISO) return "Schedule pending";

  try {
    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : null;

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: timezone,
    });

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    const dateLabel = dateFormatter.format(start);
    const startLabel = timeFormatter.format(start);
    const endLabel = end ? timeFormatter.format(end) : null;

    if (endLabel) {
      return `${dateLabel} · ${startLabel} – ${endLabel}`;
    }

    return `${dateLabel} · ${startLabel}`;
  } catch (error) {
    return "Schedule pending";
  }
};

function SessionRow({ session, href }) {
  const participantCount = session?.participantCount ?? session?.participants ?? 0;
  const venueName = session?.venue?.name ?? session?.venueName;
  const timezone = session?.timezone;
  const scheduleLabel = formatDateRange(session?.start, session?.end, timezone);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900/40 px-4 py-4 transition-all hover:border-blue-200/80 hover:shadow-md dark:hover:border-blue-600/60">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <i className="far fa-calendar text-blue-500" />
          {scheduleLabel}
        </span>
        {venueName && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            <i className="fas fa-map-marker-alt text-[10px]" />
            {venueName}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <i className="fas fa-users text-[10px]" />
          {participantCount} participant{participantCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1">
          <i className="fas fa-clock text-[10px]" />
          {timezone ? `Timezone: ${timezone}` : "Timezone pending"}
        </span>
        <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-500">
          <Link href={href}>
            <i className="fas fa-door-open" />
            View participants
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function AdminAssignmentSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { courseId, assignmentId } = params;
  const subjectId = courseId;

  const page = Number(searchParams.get("page") || 1);
  const q = searchParams.get("q") || "";

  const [searchValue, setSearchValue] = useState(q);
  const [course, setCourse] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  useEffect(() => {
    let active = true;
    setMetaLoading(true);
    Promise.all([
      courseService.getCourse(courseId).catch(() => null),
      assignmentService.getAssignmentById(assignmentId).catch(() => null),
    ])
      .then(([courseResp, assignmentResp]) => {
        if (!active) return;
        if (courseResp?.success) setCourse(courseResp.data);
        else setCourse(courseResp ?? null);

        if (assignmentResp?.success !== undefined) setAssignment(assignmentResp?.data);
        else setAssignment(assignmentResp ?? null);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId, assignmentId]);

  const queryParams = useMemo(() => {
    const base = {
      pageNum: page,
      pageSize: PAGE_SIZE,
    };
    if (q) base.q = q;
    return base;
  }, [page, q]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAssignmentSessions(subjectId, assignmentId, queryParams, { enabled: Boolean(subjectId && assignmentId) });

  const sessions = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const updateQuery = useCallback(
    (next) => {
      const sp = new URLSearchParams(searchParams);
      if ("q" in next) {
        const value = next.q?.trim();
        if (value) sp.set("q", value);
        else sp.delete("q");
      }
      if ("page" in next) {
        sp.set("page", String(next.page));
      } else {
        sp.set("page", "1");
      }
      router.replace(`?${sp.toString()}`);
    },
    [router, searchParams]
  );

  const onSubmitSearch = (event) => {
    event.preventDefault();
    updateQuery({ q: searchValue, page: 1 });
  };

  const clearSearch = () => {
    setSearchValue("");
    updateQuery({ q: "", page: 1 });
  };

  const goToPage = (nextPage) => {
    const safePage = Math.min(pageCount, Math.max(1, nextPage));
    updateQuery({ page: safePage });
  };

  const courseLabel = metaLoading
    ? "Loading course…"
    : `${course?.courseCode || ""} ${course?.courseName || ""}`.trim() || `Course ${courseId}`;
  const assignmentLabel = metaLoading
    ? "Loading assignment…"
    : assignment?.name || `Assignment ${assignmentId}`;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3">
        <nav
          className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
          aria-label="Breadcrumb"
        >
          <Link href="/admin" className="font-semibold text-blue-600">
            OAS
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin/results" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Results Hub
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="font-semibold text-blue-600">Session list</span>
        </nav>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <i className="fas fa-calendar-check" />
              Assignment sessions
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
              <span className="flex items-center gap-2">
                <i className="fas fa-book" />
                {courseLabel}
              </span>
              <span className="flex items-center gap-2">
                <i className="fas fa-id-badge" />
                Course ID: {courseId}
              </span>
              {(course?.academicYear || course?.semester) && (
                <span className="flex items-center gap-2">
                  <i className="fas fa-calendar" />
                  {course?.academicYear || "Academic Year"}
                  {course?.semester ? ` • Semester ${course.semester}` : ""}
                </span>
              )}
              <span className="flex items-center gap-2">
                <i className="fas fa-tasks" />
                {assignmentLabel}
              </span>
            </div>
          </div>
          <Button asChild variant="secondary" className="bg-white/15 hover:bg-white/20 text-white">
            <Link href={`/admin/courses/${courseId}/assignments/${assignmentId}`}>
              <i className="fas fa-arrow-left" />
              Back to assignment
            </Link>
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <form onSubmit={onSubmitSearch} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <label htmlFor="session-search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search sessions
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="session-search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by date, time, or venue"
                className="w-64"
              />
              <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-500">
                <i className="fas fa-search" />
                Apply
              </Button>
              {q && (
                <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching && <i className="fas fa-spinner fa-spin mr-2" />}
            Refresh
          </Button>
        </form>

        {isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-700 bg-red-50/80 dark:bg-red-900/30 px-4 py-4 text-sm text-red-700 dark:text-red-200">
            <i className="fas fa-exclamation-triangle mt-1" aria-hidden="true" />
            <div>
              Failed to load sessions for this assignment. Please try again.
            </div>
          </div>
        )}

        {isLoading && !data ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-100/80 dark:bg-gray-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
              <i className="fas fa-calendar-plus" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No sessions configured</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Configure sessions in Assignment Setup to continue with results review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => {
              const sessionId = session?.sessionId ?? session?.id;

              let href = "#";
              if (sessionId) {
                const query = new URLSearchParams();
                if (session?.start) query.set("start", session.start);
                if (session?.end) query.set("end", session.end);
                if (session?.timezone) query.set("timezone", session.timezone);
                const venueName = session?.venue?.name ?? session?.venueName;
                if (venueName) query.set("venue", venueName);
                const participantCount = session?.participantCount ?? session?.participants;
                if (typeof participantCount === "number") query.set("participantCount", String(participantCount));

                const queryString = query.toString();
                href = queryString
                  ? `/admin/courses/${courseId}/assignments/${assignmentId}/results/sessions/${sessionId}?${queryString}`
                  : `/admin/courses/${courseId}/assignments/${assignmentId}/results/sessions/${sessionId}`;
              }

              return <SessionRow key={sessionId ?? `session-${index}`} session={session} href={href} />;
            })}
          </div>
        )}

        {sessions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-gray-600 dark:text-gray-300">
            <div>
              Page {page} of {pageCount} · {total} session{total === 1 ? "" : "s"} total
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                <i className="fas fa-chevron-left" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= pageCount}
              >
                Next
                <i className="fas fa-chevron-right" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
