"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionParticipants } from "@/hooks/admin/results/useSessionParticipants.js";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";
import ReleaseStatusBadge from "@/components/admin/results/ReleaseStatusBadge.jsx";

const PAGE_SIZE = 20;

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "released", label: "Released" },
  { value: "not_released", label: "Not released" },
];

const typeOptions = [
  { value: "ALL", label: "All participants" },
  { value: "GROUP", label: "Groups" },
  { value: "INDIVIDUAL", label: "Individuals" },
];

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

function ParticipantCard({ participant, detailHref, typeLabel }) {
  const isGroup = participant?.groupId !== undefined;
  const memberCount = participant?.memberCount ?? participant?.members?.length ?? 0;
  const members = Array.isArray(participant?.members) ? participant.members : [];
  const releaseStatus = participant?.releaseStatus ?? "NOT_RELEASED";
  const displayName = isGroup ? participant?.groupName ?? `Group ${participant?.groupId}` : participant?.name;
  const studentNumber = !isGroup ? participant?.studentNumber : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900/40 px-4 py-4 transition-all hover:border-blue-200/80 hover:shadow-md dark:hover:border-blue-600/60">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-semibold text-gray-900 dark:text-gray-50">{displayName || "Unnamed"}</span>
        <ReleaseStatusBadge status={releaseStatus} />
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <i className="fas fa-user-friends text-[10px]" />
          {typeLabel}
        </span>
        {isGroup && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-200">
            <i className="fas fa-users text-[10px]" />
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </span>
        )}
        {!isGroup && studentNumber && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            <i className="fas fa-id-card-alt text-[10px]" />
            {studentNumber}
          </span>
        )}
        <div className="ml-auto">
          {detailHref ? (
            <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-500">
              <Link href={detailHref}>
                <i className="fas fa-door-open" />
                View detail
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <i className="fas fa-ban" />
              Unavailable
            </Button>
          )}
        </div>
      </div>

      {isGroup && members.length > 0 && (
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-3 py-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <i className="fas fa-users" />
            Group members
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {members.map((member) => (
              <span
                key={member?.studentId ?? member?.name}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <i className="fas fa-user text-[10px]" />
                {member?.name || `Student ${member?.studentId}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSessionParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { courseId, assignmentId, sessionId } = params;
  const subjectId = courseId;

  const page = Number(searchParams.get("page") || 1);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "ALL";

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
      status,
      type,
    };
    if (q) base.q = q;
    return base;
  }, [page, status, type, q]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useSessionParticipants(subjectId, assignmentId, sessionId, queryParams, {
    enabled: Boolean(subjectId && assignmentId && sessionId),
  });

  const participants = data?.items ?? [];
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

      if ("status" in next) {
        const value = next.status && next.status !== "all" ? next.status : null;
        if (value) sp.set("status", value);
        else sp.delete("status");
      }

      if ("type" in next) {
        const value = next.type && next.type !== "ALL" ? next.type : null;
        if (value) sp.set("type", value);
        else sp.delete("type");
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

  const onStatusChange = (value) => {
    updateQuery({ status: value, page: 1 });
  };

  const onTypeChange = (value) => {
    updateQuery({ type: value, page: 1 });
  };

  const courseLabel = metaLoading
    ? "Loading course…"
    : `${course?.courseCode || ""} ${course?.courseName || ""}`.trim() || `Course ${courseId}`;
  const assignmentLabel = metaLoading
    ? "Loading assignment…"
    : assignment?.name || `Assignment ${assignmentId}`;

  const sessionStart = searchParams.get("start") || undefined;
  const sessionEnd = searchParams.get("end") || undefined;
  const sessionTimezone = searchParams.get("timezone") || undefined;
  const sessionVenue = searchParams.get("venue") || undefined;
  const sessionCountHint = searchParams.get("participantCount") || undefined;

  const scheduleLabel = formatDateRange(sessionStart, sessionEnd, sessionTimezone);
  const sessionCountFromLink = Number(sessionCountHint);
  const participantCountLabel = Number.isFinite(sessionCountFromLink)
    ? sessionCountFromLink
    : total;

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
          <Link
            href={`/admin/courses/${courseId}/assignments/${assignmentId}/results`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Session list
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="font-semibold text-blue-600">Session {sessionId}</span>
        </nav>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-indigo-100/80">
              Session participants
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <i className="fas fa-users" />
              Review session participants
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-indigo-100 text-sm">
              <span className="flex items-center gap-2">
                <i className="fas fa-book" />
                {courseLabel}
              </span>
              <span className="flex items-center gap-2">
                <i className="fas fa-id-badge" />
                Assignment ID: {assignmentId}
              </span>
              <span className="flex items-center gap-2">
                <i className="fas fa-tasks" />
                {assignmentLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-indigo-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <i className="fas fa-calendar-alt" />
              {scheduleLabel}
            </div>
            {sessionVenue && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <i className="fas fa-map-marker-alt" />
                {sessionVenue}
              </div>
            )}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <i className="fas fa-users" />
              {participantCountLabel} participant{participantCountLabel === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={onSubmitSearch} className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <label htmlFor="participant-search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search participants
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="participant-search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by name or member"
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
          </form>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Status</span>
              <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Type</span>
              <Select value={type} onValueChange={onTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All participants" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching && <i className="fas fa-spinner fa-spin mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-700 bg-red-50/80 dark:bg-red-900/30 px-4 py-4 text-sm text-red-700 dark:text-red-200">
            <i className="fas fa-exclamation-triangle mt-1" aria-hidden="true" />
            <div>
              Failed to load participants for this session. Please try again.
            </div>
          </div>
        )}

        {isLoading && !data ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-100/80 dark:bg-gray-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : participants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
              <i className="fas fa-users-slash" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No participants yet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Adjust filters or confirm that participants are linked to this session.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant, index) => {
              const isGroup = participant?.groupId !== undefined;
              const participantId = isGroup ? participant.groupId : participant?.studentId;
              const typeLabel = isGroup ? "Group" : "Individual";
              const hasParticipantId = participantId !== undefined && participantId !== null;
              const detailHref = hasParticipantId
                ? isGroup
                  ? `/admin/courses/${courseId}/assignments/${assignmentId}/results/group/${participantId}?sessionId=${sessionId}`
                  : `/admin/courses/${courseId}/assignments/${assignmentId}/results/individual/${participantId}?sessionId=${sessionId}`
                : null;
              const key = hasParticipantId ? `${typeLabel}-${participantId}` : `${typeLabel}-${index}`;

              return (
                <ParticipantCard
                  key={key}
                  participant={participant}
                  detailHref={detailHref}
                  typeLabel={typeLabel}
                />
              );
            })}
          </div>
        )}

        {participants.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-gray-600 dark:text-gray-300">
            <div>
              Page {page} of {pageCount} · {total} participant{total === 1 ? "" : "s"} total
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                <i className="fas fa-chevron-left" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= pageCount}>
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
