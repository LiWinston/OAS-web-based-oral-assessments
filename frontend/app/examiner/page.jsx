"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useExaminerAuth } from "@/hooks/useExaminerAuth";
import { ExaminerStatsCards } from "@/components/examiner/dashboard/ExaminerStatsCards";
import { AssignmentsActionPanel } from "@/components/examiner/dashboard/AssignmentsActionPanel";
import { TodaysSchedule } from "@/components/examiner/dashboard/TodaysSchedule";
import { PendingFeedback } from "@/components/examiner/dashboard/PendingFeedback";
import { WeeklyCalendar } from "@/components/examiner/dashboard/WeeklyCalendar";
import { Button } from "@/components/ui/button";
import { examinerTimeslotService } from "@/services/examinerTimeslotService";
import formatVenue from "@/utils/formatVenue";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatISODate(date) {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: timeZone || undefined,
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
    });
  }
}

function formatDisplayTime(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: timeZone || undefined,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    return date.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
}

function getZonedDayStart(date, timeZone) {
  if (!timeZone) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
    const month = Number(parts.find((p) => p.type === "month")?.value ?? "1") - 1;
    const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");
    return new Date(Date.UTC(year, month, day));
  } catch (error) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }
}

function formatRelativeTime(target, now, { timeZone } = {}) {
  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes <= -60) {
    const hours = Math.abs(Math.round(diffMinutes / 60));
    return `${hours}h ago`;
  }
  if (diffMinutes < 0) {
    return `${Math.abs(diffMinutes)} min ago`;
  }
  if (diffMinutes === 0) return "Now";
  if (diffMinutes < 60) return `In ${diffMinutes} min`;
  if (diffMinutes < 180) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `In ${hours}h ${minutes}m`;
  }
  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `In ${hours}h`;
  }
  const targetDay = getZonedDayStart(target, timeZone);
  const nowDay = getZonedDayStart(now, timeZone);
  const diffDays = Math.round((targetDay.getTime() - nowDay.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === 0) return "Later today";
  return `In ${diffDays} days`;
}

function buildParticipantLabel(session) {
  if (Array.isArray(session.participants) && session.participants.length > 0) {
    return session.participants.slice(0, 3).join(", ");
  }

  if (Array.isArray(session.enrolledStudents) && session.enrolledStudents.length > 0) {
    const first = session.enrolledStudents[0];
    if (session.enrolledStudents.length === 1) {
      return first?.name || first?.studentNumber || "Student booking";
    }
    return `${session.enrolledStudents.length} students booked`;
  }

  if (Array.isArray(session.enrolledGroups) && session.enrolledGroups.length > 0) {
    const first = session.enrolledGroups[0];
    if (session.enrolledGroups.length === 1) {
      return first?.name || `Group ${first?.id ?? ""}`.trim();
    }
    return `${session.enrolledGroups.length} groups booked`;
  }

  if (session.isBooked) {
    return "Booked";
  }

  return "";
}

function normalizeAssignmentsResponse(response) {
  if (!response?.success) return [];
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function ExaminerDashboard() {
  const { user, examinerId, isValidExaminer } = useExaminerAuth();
  const today = startOfDay(new Date());
  const [calendarView, setCalendarView] = useState("week");
  const displayName = user?.username || user?.name || user?.email || "Examiner";

  const assignmentsQuery = useQuery({
    queryKey: ["examiner-dashboard", "assignments", examinerId],
    enabled: isValidExaminer,
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      examinerTimeslotService.getAvailableAssignments(examinerId, {
        pageSize: 50,
      }),
  });

  const scheduleQuery = useQuery({
    queryKey: ["examiner-dashboard", "schedule", examinerId],
    enabled: isValidExaminer,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    queryFn: () => examinerTimeslotService.getExaminerSchedule(examinerId),
  });

  const assignmentsList = useMemo(
    () => normalizeAssignmentsResponse(assignmentsQuery.data),
    [assignmentsQuery.data]
  );

  const rawScheduleSessions = useMemo(() => {
    const assignments = scheduleQuery.data?.data?.assignments ?? [];
    const sessions = [];

    assignments.forEach((assignment) => {
      const sessionList = assignment.sessions ?? assignment.slots ?? [];
      sessionList.forEach((session) => {
        const start = session.start ? new Date(session.start) : null;
        const end = session.end ? new Date(session.end) : null;
        const timelineStatus = (() => {
          if (!start) return "UPCOMING";
          if (end && new Date() > end) return "COMPLETED";
          if (new Date() >= start && (!end || new Date() <= end)) return "IN_PROGRESS";
          return "UPCOMING";
        })();

        sessions.push({
          ...session,
          sessionId: session.sessionId ?? session.slotId ?? session.id,
          assignmentId: assignment.assignmentId,
          assignmentName: assignment.assignmentName,
          courseCode: assignment.courseCode,
          courseName: assignment.courseName,
          startDate: start,
          endDate: end,
          startISO: session.start ?? null,
          endISO: session.end ?? null,
          timezone: session.timezone ?? "Australia/Melbourne",
          timelineStatus,
          venueLabel: formatVenue(session.venue),
          participantsLabel: buildParticipantLabel(session),
        });
      });
    });

    return sessions.sort((a, b) => {
      if (!a.startDate || !b.startDate) return 0;
      return a.startDate - b.startDate;
    });
  }, [scheduleQuery.data]);

  const scheduleSessions = useMemo(
    () =>
      rawScheduleSessions.map((session) => {
        const normalizedStatus = (session.markingStatus || session.status || "").toUpperCase();
        return {
          ...session,
          markingStatus: normalizedStatus || "UNMARKED",
        };
      }),
    [rawScheduleSessions]
  );

  const todaySessions = useMemo(
    () =>
      scheduleSessions.filter(
        (session) => session.startDate && sameDay(session.startDate, today)
      ),
    [scheduleSessions, today]
  );

  const upcomingSessions = useMemo(
    () =>
      scheduleSessions.filter(
        (session) =>
          session.startDate && session.startDate >= today && session.timelineStatus !== "COMPLETED"
      ),
    [scheduleSessions, today]
  );

  const queueItems = useMemo(() => {
    const now = new Date();
      return upcomingSessions.map((session) => {
        const markingStatus = session.markingStatus;
        const isSubmitted = markingStatus === "SUBMITTED";
        const isDraft = markingStatus === "DRAFT" || markingStatus === "REOPENED";

        let urgency = "UPCOMING";
        if (!isSubmitted && session.startDate) {
          if (sameDay(session.startDate, today)) {
            urgency = "OVERDUE";
          } else if (session.startDate.getTime() - today.getTime() <= 24 * 60 * 60 * 1000) {
            urgency = "DUE_SOON";
          }
        } else if (isSubmitted) {
          urgency = "COMPLETED";
        }

        const assignmentPath =
          session.assignmentId != null
            ? `/examiner/assessment/${session.assignmentId}/${session.sessionId}`
            : `/examiner/assessment?sessionId=${session.sessionId}`;

        const sessionTimeRange = session.startDate
          ? session.endDate
            ? `${formatDisplayTime(session.startDate, session.timezone)} - ${formatDisplayTime(session.endDate, session.timezone)}`
            : formatDisplayTime(session.startDate, session.timezone)
          : "";

        const venueLabel = session.venueLabel || formatVenue(session.venue) || "";
        const isBooked = typeof session.isBooked === "boolean" ? session.isBooked : Boolean(session.bookingCount);
        const actionDisabled = !isBooked;

        return {
          id: session.sessionId,
          title: session.assignmentName,
          courseCode: session.courseCode,
          entity: session.participantsLabel,
          sessionDate: session.startDate
            ? formatDisplayDate(session.startDate, session.timezone)
            : "TBC",
          sessionTimeRange,
          venueLabel,
          isBooked,
          timeLabel: session.startDate
            ? formatRelativeTime(session.startDate, now, { timeZone: session.timezone })
            : "",
          urgency,
          progressLabel: isSubmitted
            ? "Submitted"
            : isDraft
            ? "Draft saved"
            : "Not started",
          actionHref: assignmentPath,
          actionLabel: isSubmitted ? "Review" : "Open marking",
          actionIcon: isSubmitted ? "fa-eye" : "fa-arrow-right",
          actionDisabled,
          actionTooltip: actionDisabled
            ? "Session not booked yet. Marking opens once a student is scheduled."
            : undefined,
          assignmentId: session.assignmentId,
          startDate: session.startDate,
          timezone: session.timezone,
        };
      });
  }, [upcomingSessions, today]);

  const stats = useMemo(() => {
    const sessionsToday = todaySessions.length;
    const pendingMarking = queueItems.filter((item) => item.urgency !== "COMPLETED").length;
    const pendingDueToday = queueItems.filter((item) => item.urgency === "OVERDUE").length;

    return {
      sessionsToday,
      pendingMarking,
      pendingDueToday,
      submittedThisWeek: 0,
      studentsAssessedWeek: 0,
    };
  }, [todaySessions, queueItems]);

  const weeklyCalendar = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const daySessions = scheduleSessions.filter(
        (session) => session.startDate && sameDay(session.startDate, date)
      );
      days.push({
        dateKey: formatISODate(date),
        displayDate: date.getDate(),
        label: date.toLocaleDateString("en-AU", { weekday: "short" }),
        isToday: i === 0,
        events: daySessions.map((session) => ({
          id: session.sessionId,
          title: session.assignmentName,
          timeLabel: session.startDate
            ? session.startDate.toLocaleTimeString("en-AU", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "TBC",
          status: session.timelineStatus,
          markingStatus: session.markingStatus,
          markingLabel:
            session.markingStatus === "SUBMITTED"
              ? "Submitted"
              : session.markingStatus === "DRAFT"
              ? "Draft"
              : session.markingStatus === "REOPENED"
              ? "Reopened"
              : session.markingStatus === "UNMARKED"
              ? "Pending"
              : "",
          courseCode: session.courseCode,
          courseName: session.courseName,
          assignmentId: session.assignmentId,
          session,
        })),
      });
    }
    return days;
  }, [scheduleSessions, today]);

  const monthCalendar = useMemo(() => {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const gridStart = new Date(firstOfMonth);
    const weekdayIndex = gridStart.getDay(); // 0 (Sun) - 6 (Sat)
    gridStart.setDate(gridStart.getDate() - weekdayIndex);

    const weeks = [];
    for (let weekIdx = 0; weekIdx < 6; weekIdx += 1) {
      const weekRow = [];
      for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
        const current = new Date(gridStart);
        current.setDate(gridStart.getDate() + weekIdx * 7 + dayIdx);

        const daySessions = scheduleSessions.filter(
          (session) => session.startDate && sameDay(session.startDate, current)
        );

        weekRow.push({
          dateKey: formatISODate(current),
          displayDate: current.getDate(),
          isToday: sameDay(current, today),
          isCurrentMonth: current.getMonth() === today.getMonth(),
          events: daySessions.map((session) => ({
            id: session.sessionId,
            title: session.assignmentName,
            timeLabel: session.startDate
              ? session.startDate.toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "TBC",
            status: session.timelineStatus,
            markingStatus: session.markingStatus,
            courseCode: session.courseCode,
            courseName: session.courseName,
            assignmentId: session.assignmentId,
            session,
          })),
        });
      }
      weeks.push(weekRow);
    }
    return weeks;
  }, [scheduleSessions, today]);

  const queueAssignmentsMap = useMemo(() => {
    const map = new Map();
    queueItems.forEach((item) => {
      if (!item.assignmentId || !item.startDate) return;
      const existing = map.get(item.assignmentId);
      if (!existing || item.startDate < existing.startDate) {
        map.set(item.assignmentId, item);
      }
    });
    return map;
  }, [queueItems]);

  const assignmentSummaries = useMemo(() => {
    const summaryMap = new Map();
    assignmentsList.forEach((assignment) => {
      summaryMap.set(assignment.assignmentId, {
        assignmentId: assignment.assignmentId,
        assignmentName: assignment.assignmentName,
        courseCode: assignment.courseCode,
        courseName: assignment.courseName,
        statusLabel: assignment.statusLabel,
        availableSessions: assignment.availableTimeslots ?? 0,
        unmarkedCount: 0,
        draftCount: 0,
        submittedCount: 0,
        nextEventLabel: null,
        nextEventDate: null,
        nextEventTime: null,
        _nextUpcomingSession: null,
        _nextPendingAssessment: null,
      });
    });

    scheduleSessions.forEach((session) => {
      const assignmentId = session.assignmentId;
      if (!assignmentId) return;
      if (!summaryMap.has(assignmentId)) {
        summaryMap.set(assignmentId, {
          assignmentId,
          assignmentName: session.assignmentName ?? `Assignment ${assignmentId}`,
          courseCode: session.courseCode ?? "",
          courseName: session.courseName ?? "",
          statusLabel: "",
          availableSessions: undefined,
          unmarkedCount: 0,
          draftCount: 0,
          submittedCount: 0,
          nextEventLabel: null,
          nextEventDate: null,
          nextEventTime: null,
          _nextUpcomingSession: null,
          _nextPendingAssessment: null,
        });
      }
      const entry = summaryMap.get(assignmentId);
      const markingStatus = session.markingStatus;
      if (markingStatus === "SUBMITTED") {
        entry.submittedCount += 1;
      } else if (markingStatus === "DRAFT" || markingStatus === "REOPENED") {
        entry.draftCount += 1;
      } else {
        entry.unmarkedCount += 1;
      }

      if (session.startDate) {
        if (session.markingStatus && session.markingStatus !== "SUBMITTED") {
          if (
            !entry._nextPendingAssessment ||
            session.startDate < entry._nextPendingAssessment.date
          ) {
            entry._nextPendingAssessment = {
              date: session.startDate,
              timeZone: session.timezone,
            };
          }
        }

        if (session.startDate >= today) {
          if (
            !entry._nextUpcomingSession ||
            session.startDate < entry._nextUpcomingSession.date
          ) {
            entry._nextUpcomingSession = {
              date: session.startDate,
              timeZone: session.timezone,
            };
          }
        }
      }
    });

    return Array.from(summaryMap.values())
      .map((entry) => {
        const queueItem = queueAssignmentsMap.get(entry.assignmentId);
        if (queueItem) {
          entry.nextEventLabel = "Next assessment";
          entry.nextEventDate = formatDisplayDate(queueItem.startDate, queueItem.timezone);
          entry.nextEventTime = formatDisplayTime(queueItem.startDate, queueItem.timezone);
        } else if (entry._nextUpcomingSession) {
          entry.nextEventLabel = "Next session";
          entry.nextEventDate = formatDisplayDate(
            entry._nextUpcomingSession.date,
            entry._nextUpcomingSession.timeZone
          );
          entry.nextEventTime = formatDisplayTime(
            entry._nextUpcomingSession.date,
            entry._nextUpcomingSession.timeZone
          );
        } else if (entry._nextPendingAssessment) {
          entry.nextEventLabel = "Next assessment";
          entry.nextEventDate = formatDisplayDate(
            entry._nextPendingAssessment.date,
            entry._nextPendingAssessment.timeZone
          );
          entry.nextEventTime = formatDisplayTime(
            entry._nextPendingAssessment.date,
            entry._nextPendingAssessment.timeZone
          );
        }

        delete entry._nextUpcomingSession;
        delete entry._nextPendingAssessment;
        return entry;
      })
      .sort(
        (a, b) =>
          b.unmarkedCount +
          b.draftCount +
          (b.availableSessions || 0) -
          (a.unmarkedCount + a.draftCount + (a.availableSessions || 0))
      );
  }, [assignmentsList, scheduleSessions, today, queueAssignmentsMap]);

  if (!isValidExaminer) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-6">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <i className="fas fa-lock text-lg" />
            <div>
              <p className="font-semibold">Examiner access required</p>
              <p className="text-sm opacity-80">
                Please sign in with an examiner account to view the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasError = assignmentsQuery.isError || scheduleQuery.isError;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-6 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {displayName}!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Here is the latest snapshot of your assessments and schedule.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/examiner/schedule">
            <Button variant="secondary">
              <i className="fas fa-calendar mr-2" />
              Manage schedule
            </Button>
          </Link>
          <Link href="/examiner/assessment">
            <Button variant="outline">
              <i className="fas fa-list-check mr-2" />
              Open marking workspace
            </Button>
          </Link>
        </div>
      </div>

      {hasError && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-200">
          <i className="fas fa-exclamation-triangle mr-2" />
          Some dashboard data could not be loaded. Try refreshing the page.
        </div>
      )}

      <ExaminerStatsCards stats={stats} isLoading={assignmentsQuery.isLoading || scheduleQuery.isLoading} />

      <AssignmentsActionPanel
        assignments={assignmentSummaries}
        isLoading={assignmentsQuery.isLoading || scheduleQuery.isLoading}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WeeklyCalendar
            week={weeklyCalendar}
            month={monthCalendar}
            view={calendarView}
            onViewChange={setCalendarView}
            isLoading={scheduleQuery.isLoading}
          />

          <PendingFeedback
            items={queueItems}
            isLoading={scheduleQuery.isLoading}
          />
        </div>

        <div className="space-y-6">
          <TodaysSchedule
            sessions={todaySessions.map((session) => ({
              sessionId: session.sessionId,
              assignmentName: session.assignmentName,
              courseCode: session.courseCode,
              courseName: session.courseName,
              start: session.startISO,
              end: session.endISO,
              timezone: session.timezone,
              timelineStatus: session.timelineStatus,
              markingStatus: session.markingStatus,
              participantsLabel: session.participantsLabel,
              venueLabel: session.venueLabel,
              actionHref:
                session.assignmentId != null
                  ? `/examiner/assessment/${session.assignmentId}/${session.sessionId}`
                  : `/examiner/assessment?sessionId=${session.sessionId}`,
            }))}
            isLoading={scheduleQuery.isLoading}
          />

          <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                <i className="fas fa-book-open text-purple-600 dark:text-purple-200" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-purple-900 dark:text-purple-200">
                  Need a refresher?
                </h2>
                <p className="text-sm text-purple-800 dark:text-purple-300 mt-1">
                  Browse examiner documentation for marking tips, session policies, and troubleshooting.
                </p>
                <Link
                  href="/examiner/documentation"
                  className="mt-3 inline-flex items-center text-sm font-medium text-purple-700 hover:text-purple-900 dark:text-purple-200 dark:hover:text-purple-100"
                >
                  Open documentation
                  <i className="fas fa-arrow-right ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
