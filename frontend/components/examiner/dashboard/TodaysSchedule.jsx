"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

const timelineMeta = {
  IN_PROGRESS: {
    label: "In progress",
    className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    icon: "fa-play-circle",
  },
  UPCOMING: {
    label: "Upcoming",
    className: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    icon: "fa-clock",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    icon: "fa-check",
  },
};

const markingMeta = {
  UNMARKED: {
    label: "Not started",
    className: "text-orange-600 dark:text-orange-300",
    icon: "fa-hourglass-half",
  },
  DRAFT: {
    label: "Draft saved",
    className: "text-amber-600 dark:text-amber-300",
    icon: "fa-edit",
  },
  REOPENED: {
    label: "Needs attention",
    className: "text-red-600 dark:text-red-300",
    icon: "fa-exclamation-circle",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "text-green-600 dark:text-green-300",
    icon: "fa-check-circle",
  },
};

function formatTimeRange(start, end, timezone = "Australia/Melbourne") {
  if (!start || !end) return "TBC";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  };

  return `${startDate.toLocaleTimeString("en-AU", options)} – ${endDate.toLocaleTimeString("en-AU", options)}`;
}

function formatDate(start, timezone = "Australia/Melbourne") {
  if (!start) return "";
  const startDate = new Date(start);
  return startDate.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: timezone,
  });
}

function renderSkeletonItems(count = 3) {
  return Array.from({ length: count }).map((_, idx) => (
    <div
      key={`skeleton-${idx}`}
      className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
    >
      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-36 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
      <div className="mt-4 h-6 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
    </div>
  ));
}

export function TodaysSchedule({
  sessions = [],
  isLoading = false,
  scheduleHref = "/examiner/schedule",
}) {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2" />
            Today's Schedule
          </CardTitle>
          <Link
            href={scheduleHref}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View full schedule
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading && renderSkeletonItems()}

          {!isLoading &&
            sessions.map((session) => {
              const timeline = timelineMeta[session.timelineStatus] ?? timelineMeta.UPCOMING;
              const marking = markingMeta[session.markingStatus] ?? markingMeta.UNMARKED;
              return (
                <div
                  key={session.sessionId ?? session.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="md:flex md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${timeline.className}`}
                        >
                          <i className={`fas ${timeline.icon} mr-1`} />
                          {timeline.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(session.start, session.timezone)}
                        </span>
                      </div>
                      <div className="mt-2 font-medium text-gray-900 dark:text-white">
                        {session.assignmentName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {session.courseCode}
                        {session.courseName ? ` · ${session.courseName}` : ""}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-3 md:mt-0 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <i className="fas fa-clock text-gray-400 mr-2" />
                        {formatTimeRange(session.start, session.end, session.timezone)}
                      </div>
                      {session.venueLabel && (
                        <div className="flex items-center">
                          <i className="fas fa-map-marker-alt text-gray-400 mr-2" />
                          <span className="truncate">{session.venueLabel}</span>
                        </div>
                      )}
                      {session.participantsLabel && (
                        <div className="flex items-center">
                          <i className="fas fa-users text-gray-400 mr-2" />
                          <span className="truncate">{session.participantsLabel}</span>
                        </div>
                      )}
                      <div className={`flex items-center text-xs font-medium ${marking.className}`}>
                        <i className={`fas ${marking.icon} mr-1`} />
                        {marking.label}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href={session.actionHref || `/examiner/assessment?sessionId=${session.sessionId}`}
                      className="inline-flex"
                    >
                      <Button
                        size="sm"
                        className={`${
                          session.markingStatus === "SUBMITTED"
                            ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                        variant="default"
                      >
                        <i
                          className={`fas ${
                            session.markingStatus === "SUBMITTED" ? "fa-eye" : "fa-arrow-right"
                          } mr-2`}
                        />
                        {session.markingStatus === "SUBMITTED" ? "View submission" : "Open marking"}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>

        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-10">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <i className="fas fa-calendar-check text-4xl mb-2" />
              <p>No sessions scheduled for today</p>
            </div>
            <Link href={scheduleHref}>
              <Button variant="outline">Browse schedule</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
