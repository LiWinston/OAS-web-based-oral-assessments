"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Spinner } from "../../ui/spinner";
import { Badge } from "../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { courseAdminSessionService } from "../../../services/courseAdminSessionService";

const eventStyles = {
  "session-ready": {
    bg: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    border: "border-l-4 border-green-500",
    icon: "fas fa-check-circle text-green-500",
  },
  "session-warning": {
    bg: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
    border: "border-l-4 border-amber-500",
    icon: "fas fa-exclamation-triangle text-amber-500",
  },
  "session-critical": {
    bg: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    border: "border-l-4 border-red-500",
    icon: "fas fa-exclamation-circle text-red-500",
  },
  due: {
    bg: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
    border: "border-l-4 border-blue-500",
    icon: "fas fa-calendar-check text-blue-500",
  },
  start: {
    bg: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
    border: "border-l-4 border-purple-500",
    icon: "fas fa-flag text-purple-500",
  },
};

const DAYS_IN_CALENDAR = 42; // 6 weeks * 7 days

const EVENT_PRIORITY = {
  "session-critical": 0,
  "session-warning": 1,
  "session-ready": 2,
  due: 3,
  start: 4,
};

const severityMeta = {
  "session-critical": { label: "Needs staffing", variant: "destructive" },
  "session-warning": { label: "Partially staffed", variant: "secondary" },
  "session-ready": { label: "Ready", variant: "default" },
  due: { label: "Due", variant: "outline" },
  start: { label: "Opens", variant: "secondary" },
};

function toDateKey(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    return null;
  }
}

function ensureEntry(map, dateKey) {
  if (!map.has(dateKey)) {
    map.set(dateKey, {
      sessions: 0,
      staffing: { full: 0, partial: 0, none: 0 },
      assignments: {},
      starts: new Set(),
      dues: new Set(),
    });
  }
  return map.get(dateKey);
}

function ensureAssignmentSummary(entry, assignment) {
  if (!entry.assignments[assignment.id]) {
    entry.assignments[assignment.id] = {
      id: assignment.id,
      name: assignment.name,
      courseId: assignment.courseId,
      courseCode: assignment.courseCode,
      courseName: assignment.courseName,
      status: assignment.status,
      weight: assignment.weight,
      sessions: 0,
      staffing: { full: 0, partial: 0, none: 0 },
      start: false,
      due: false,
    };
  }
  return entry.assignments[assignment.id];
}

function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getEventPriority(type) {
  return EVENT_PRIORITY[type] ?? 5;
}

function formatLongDate(dateKey) {
  if (!dateKey) return "";
  const date = new Date(dateKey);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatStatusLabel(status) {
  if (!status) return "";
  return status
    .toString()
    .toLowerCase()
    .split(/[_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildEventsForDate(entry) {
  if (!entry) return [];

  const assignments = Array.isArray(entry.assignments)
    ? entry.assignments
    : Object.values(entry.assignments || {});

  return assignments
    .map((assignment) => {
      let type = "session-ready";
      if (assignment.sessions > 0) {
        type =
          assignment.staffing.none > 0
            ? "session-critical"
            : assignment.staffing.partial > 0
            ? "session-warning"
            : "session-ready";
      } else if (assignment.due) {
        type = "due";
      } else if (assignment.start) {
        type = "start";
      }

      const detailParts = [];
      if (assignment.sessions > 0) {
        detailParts.push(
          `${assignment.sessions} session${assignment.sessions > 1 ? "s" : ""}`
        );
        if (assignment.staffing.none > 0) {
          detailParts.push(`${assignment.staffing.none} unstaffed`);
        } else if (assignment.staffing.partial > 0) {
          detailParts.push(`${assignment.staffing.partial} partially staffed`);
        } else {
          detailParts.push("Fully staffed");
        }
      }

      if (assignment.start) {
        detailParts.push("Opens");
      }
      if (assignment.due) {
        detailParts.push("Due");
      }

      return {
        type,
        title: assignment.name || `Assignment ${assignment.id}`,
        detail:
          detailParts.join(" ・ ") ||
          assignment.courseCode ||
          assignment.courseName ||
          "",
        assignment,
      };
    })
    .sort((a, b) => getEventPriority(a.type) - getEventPriority(b.type));
}

export function SimpleCalendar({
  assignments = [],
  assignmentsLoading = false,
  assignmentsError = "",
  onRefreshAssignments,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarWarnings, setCalendarWarnings] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [highlightAssignmentId, setHighlightAssignmentId] = useState(null);

  const monthKey = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [currentDate]);

  useEffect(() => {
    let isMounted = true;

    async function loadCalendar() {
      if (!assignments || assignments.length === 0) {
        if (isMounted) {
          setCalendarData({});
          setCalendarWarnings([]);
          setCalendarError("");
          setCalendarLoading(false);
        }
        return;
      }

      if (isMounted) {
        setCalendarLoading(true);
        setCalendarError("");
        setCalendarWarnings([]);
      }

      try {
        const results = await Promise.all(
          assignments.map(async (assignment) => {
            try {
              const response =
                await courseAdminSessionService.getSessionsCalendar(
                  assignment.id,
                  monthKey
                );
              return { assignment, response };
            } catch (error) {
              return {
                assignment,
                response: { success: false, message: error?.message },
              };
            }
          })
        );

        const map = new Map();
        const warnings = [];

        results.forEach(({ assignment, response }) => {
          if (response?.success && response.data) {
            const dates = response.data;
            Object.entries(dates).forEach(([dateKey, counts]) => {
              const normalizedDate = toDateKey(dateKey);
              if (!normalizedDate) return;

              const entry = ensureEntry(map, normalizedDate);
              const summary = ensureAssignmentSummary(entry, assignment);

              const fully =
                Number(counts.fullyStaffed ?? counts.fully ?? 0) || 0;
              const partial =
                Number(counts.partialStaffed ?? counts.partial ?? 0) || 0;
              const none = Number(counts.noStaffed ?? counts.none ?? 0) || 0;

              entry.sessions += fully + partial + none;
              entry.staffing.full += fully;
              entry.staffing.partial += partial;
              entry.staffing.none += none;

              summary.sessions += fully + partial + none;
              summary.staffing.full += fully;
              summary.staffing.partial += partial;
              summary.staffing.none += none;
            });
          } else {
            warnings.push(assignment.name || `Assignment ${assignment.id}`);
          }
        });

        assignments.forEach((assignment) => {
          const startKey = toDateKey(assignment.startDate);
          if (startKey) {
            const entry = ensureEntry(map, startKey);
            const summary = ensureAssignmentSummary(entry, assignment);
            summary.start = true;
            entry.starts.add(assignment.id);
          }

          const endKey = toDateKey(assignment.endDate || assignment.dueDate);
          if (endKey) {
            const entry = ensureEntry(map, endKey);
            const summary = ensureAssignmentSummary(entry, assignment);
            summary.due = true;
            entry.dues.add(assignment.id);
          }
        });

        const normalized = {};
        for (const [date, entry] of map.entries()) {
          normalized[date] = {
            sessions: entry.sessions,
            staffing: entry.staffing,
            assignments: Object.values(entry.assignments),
            starts: Array.from(entry.starts),
            dues: Array.from(entry.dues),
          };
        }

        if (isMounted) {
          setCalendarData(normalized);
          setCalendarWarnings(warnings);
        }
      } catch (error) {
        if (isMounted) {
          setCalendarData({});
          setCalendarError(error?.message || "Failed to load calendar data");
        }
      } finally {
        if (isMounted) {
          setCalendarLoading(false);
        }
      }
    }

    if (!assignmentsLoading) {
      loadCalendar();
    }

    return () => {
      isMounted = false;
    };
  }, [assignments, assignmentsLoading, monthKey]);

  useEffect(() => {
    if (!detailOpen) {
      setHighlightAssignmentId(null);
    }
  }, [detailOpen]);

  const summary = useMemo(() => {
    const values = Object.values(calendarData || {});
    if (values.length === 0) {
      return {
        totalSessions: 0,
        attentionDays: 0,
        readyDays: 0,
        dueCount: 0,
        startCount: 0,
      };
    }

    return values.reduce(
      (acc, entry) => {
        const assignmentSummaries = Array.isArray(entry.assignments)
          ? entry.assignments
          : Object.values(entry.assignments || {});

        let daySessions = 0;
        let dayNeedsAttention = false;

        assignmentSummaries.forEach((summary) => {
          daySessions += summary.sessions || 0;
          if (summary.sessions > 0) {
            if (summary.staffing.none > 0 || summary.staffing.partial > 0) {
              dayNeedsAttention = true;
            }
          }

          if (summary.due) {
            acc.dueCount += 1;
          }
          if (summary.start) {
            acc.startCount += 1;
          }
        });

        if (daySessions > 0) {
          acc.totalSessions += daySessions;
          if (dayNeedsAttention) {
            acc.attentionDays += 1;
          } else {
            acc.readyDays += 1;
          }
        }

        return acc;
      },
      {
        totalSessions: 0,
        attentionDays: 0,
        readyDays: 0,
        dueCount: 0,
        startCount: 0,
      }
    );
  }, [calendarData]);

  const selectedEntry = selectedDateKey ? calendarData[selectedDateKey] : null;

  const selectedEvents = useMemo(() => {
    if (!selectedEntry) return [];
    return buildEventsForDate(selectedEntry);
  }, [selectedEntry]);

  const detailDateLabel = formatLongDate(selectedDateKey);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = formatMonthLabel(currentDate);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    const todayKey = toDateKey(new Date());

    for (let i = 0; i < firstDay; i++) {
      const prevDate = new Date(year, month, 0 - (firstDay - 1 - i));
      days.push({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        fullDate: toDateKey(prevDate),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const fullDate = toDateKey(dateObj);
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: fullDate === todayKey,
        fullDate,
      });
    }

    const remaining = DAYS_IN_CALENDAR - days.length;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: toDateKey(nextDate),
      });
    }

    return days.slice(0, DAYS_IN_CALENDAR);
  }, [firstDay, daysInMonth, month, year]);

  const eventsForDate = (dateKey) => {
    const entry = calendarData?.[dateKey];
    return buildEventsForDate(entry);
  };

  const overallError = assignmentsError || calendarError;
  const overallLoading = assignmentsLoading || calendarLoading;

  const openDetail = (dateKey, assignmentId = null) => {
    if (!dateKey) return;
    setSelectedDateKey(dateKey);
    setHighlightAssignmentId(assignmentId || null);
    setDetailOpen(true);
  };

  const handleDayKeyDown = (event, dateKey) => {
    if ((event.key === "Enter" || event.key === " ") && dateKey) {
      event.preventDefault();
      openDetail(dateKey);
    }
  };

  const handleDialogOpenChange = (open) => {
    setDetailOpen(open);
    if (!open) {
      setHighlightAssignmentId(null);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <>
      <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-3">
                <i className="fas fa-calendar-alt text-white text-sm"></i>
              </div>
              Assignment Calendar
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={goToPreviousMonth}
                variant="outline"
                size="sm"
                className="p-2 w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </Button>
              <Button
                onClick={goToToday}
                variant="outline"
                size="sm"
                className="px-4 py-2 h-8 text-xs font-medium hover:bg-gradient-to-r from-blue-500 to-indigo-500 hover:text-white hover:border-transparent transition-all duration-200"
              >
                {monthName}
              </Button>
              <Button
                onClick={goToNextMonth}
                variant="outline"
                size="sm"
                className="p-2 w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
              >
                <i className="fas fa-chevron-right text-xs"></i>
              </Button>
            </div>
          </div>
          {overallError && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-300">
              {overallError}
            </p>
          )}
          {calendarWarnings.length > 0 && !overallError && (
            <p className="mt-2 text-xs text-amber-500 dark:text-amber-300">
              Could not load session coverage for: {calendarWarnings.join(", ")}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-2">
                <i className="fas fa-layer-group text-blue-500"></i>
                <span>
                  {summary.totalSessions} assignment Timeslots scheduled
                </span>
              </span>
              <span className="flex items-center space-x-2">
                <i className="fas fa-bell text-amber-500"></i>
                <span>
                  {summary.attentionDays} days need staffing attention
                </span>
              </span>
              <span className="flex items-center space-x-2">
                <i className="fas fa-flag text-purple-500"></i>
                <span>{summary.startCount} assignment openings</span>
              </span>
              <span className="flex items-center space-x-2">
                <i className="fas fa-calendar-check text-blue-500"></i>
                <span>{summary.dueCount} assignment deadlines</span>
              </span>
            </div>
            {overallLoading && (
              <span className="flex items-center space-x-2">
                <Spinner className="w-4 h-4" />
                <span>Updating…</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {calendarDays.map((day, index) => {
              const events = eventsForDate(day.fullDate);
              return (
                <div
                  key={`${day.fullDate}-${index}`}
                  className={`
                    calendar-day min-h-[4.5rem] border border-gray-200 dark:border-gray-700 p-2 relative rounded-lg
                    transition-all duration-200 hover:shadow-md cursor-pointer group
                    ${
                      day.isCurrentMonth
                        ? day.isToday
                          ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-600 shadow-lg"
                          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }
                  `}
                  onClick={() => openDetail(day.fullDate)}
                  onKeyDown={(event) => handleDayKeyDown(event, day.fullDate)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Assignment activity for ${formatLongDate(
                    day.fullDate
                  )}`}
                >
                  <div
                    className={`
                      text-xs mb-1 font-medium transition-colors
                      ${
                        day.isCurrentMonth
                          ? day.isToday
                            ? "text-blue-800 dark:text-blue-300 font-bold"
                            : "text-gray-700 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-500"
                      }
                    `}
                  >
                    {day.date}
                  </div>

                  <div className="space-y-1">
                    {events.slice(0, 2).map((event, eventIndex) => {
                      const style =
                        eventStyles[event.type] || eventStyles["session-ready"];
                      const isHighlighted =
                        highlightAssignmentId != null &&
                        event.assignment?.id === highlightAssignmentId;
                      return (
                        <div
                          key={`${event.type}-${
                            event.assignment?.id ?? eventIndex
                          }`}
                          className={`calendar-event text-xs p-1 rounded-md ${
                            style.bg
                          } ${
                            style.border
                          } hover:opacity-90 transition-all duration-200 transform hover:scale-105 animate-fadeInUp group-hover:shadow-sm ${
                            isHighlighted ? "ring-2 ring-blue-500" : ""
                          }`}
                          style={{ animationDelay: `${eventIndex * 90}ms` }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openDetail(day.fullDate, event.assignment?.id);
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              ev.stopPropagation();
                              openDetail(day.fullDate, event.assignment?.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center space-x-1">
                            <i className={`${style.icon} text-xs`}></i>
                            <span className="truncate font-medium">
                              {event.title}
                            </span>
                          </div>
                          {event.detail && (
                            <div className="text-[11px] opacity-75 mt-0.5 truncate">
                              {event.detail}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {events.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>

                  {day.isToday && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 text-xs border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 rounded-sm mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Fully staffed assignment days ({summary.readyDays})
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 rounded-sm mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Days needing examiner coverage ({summary.attentionDays})
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded-sm mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Assignment deadlines ({summary.dueCount})
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500 rounded-sm mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Assignment openings ({summary.startCount})
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                <span>
                  Assignments bundle multiple sessions and assessments. Select a
                  date to review coverage, openings, and deadlines across your
                  courses.
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                  Today
                </span>
                <span className="flex items-center">
                  <i className="fas fa-layer-group mr-1 text-green-500"></i>
                  {summary.totalSessions} total sessions
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detailDateLabel
                ? `Assignment Calendar — ${detailDateLabel}`
                : "Assignment Calendar"}
            </DialogTitle>
            <DialogDescription>
              Explore the assignments, sessions, and assessments scheduled for
              this date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {selectedEvents.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No assignment activity is scheduled for this date.
              </div>
            ) : (
              selectedEvents.map((event) => {
                const assignment = event.assignment || {};
                const severity = severityMeta[event.type] || {
                  label: event.type,
                  variant: "outline",
                };
                const isHighlighted =
                  highlightAssignmentId != null &&
                  assignment.id === highlightAssignmentId;
                const basePath =
                  assignment.courseId && assignment.id
                    ? `/admin/courses/${assignment.courseId}/assignments/${assignment.id}`
                    : null;
                const staffing = assignment.staffing || {
                  full: 0,
                  partial: 0,
                  none: 0,
                };

                return (
                  <div
                    key={`${event.type}-${assignment.id ?? event.title}`}
                    className={`rounded-lg border p-4 transition-shadow ${
                      isHighlighted
                        ? "border-blue-500 shadow-lg"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {assignment.name || `Assignment ${assignment.id}`}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {assignment.courseCode ||
                            assignment.courseName ||
                            "Unassigned course"}
                        </p>
                      </div>
                      <Badge variant={severity.variant}>{severity.label}</Badge>
                    </div>
                    {event.detail && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {event.detail}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-2">
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          Sessions:
                        </span>
                        <span className="ml-1 text-gray-600 dark:text-gray-300">
                          {assignment.sessions || 0}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          Staffing:
                        </span>
                        <span className="ml-1 text-gray-600 dark:text-gray-300">
                          {staffing.full} full · {staffing.partial} partial ·{" "}
                          {staffing.none} unstaffed
                        </span>
                      </div>
                      {assignment.weight != null && (
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            Weight:
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-300">
                            {assignment.weight}%
                          </span>
                        </div>
                      )}
                      {assignment.status && (
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            Status:
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-300">
                            {formatStatusLabel(assignment.status)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {assignment.start && (
                        <Badge variant="secondary">Opens this date</Badge>
                      )}
                      {assignment.due && (
                        <Badge variant="outline">Due this date</Badge>
                      )}
                    </div>

                    {basePath && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`${basePath}/timeslots`}>
                            Manage sessions
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`${basePath}/results`}>View results</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {onRefreshAssignments && (
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshAssignments}
              >
                Refresh assignments
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
