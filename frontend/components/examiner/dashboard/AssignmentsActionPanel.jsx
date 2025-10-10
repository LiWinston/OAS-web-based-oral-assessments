"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

function renderSkeleton(count = 3) {
  return Array.from({ length: count }).map((_, idx) => (
    <div
      key={`assignment-skeleton-${idx}`}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/40 p-4 space-y-3 animate-pulse"
    >
      <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  ));
}

export function AssignmentsActionPanel({
  assignments = [],
  isLoading = false,
  scheduleHref = "/examiner/assessment",
  resultsHref = "/examiner/results",
}) {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clipboard-list text-blue-600 dark:text-blue-400 mr-2" />
            Assignments Needing Attention
          </CardTitle>
          <Link
            href={scheduleHref}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Manage schedule
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {isLoading && renderSkeleton()}

        {!isLoading &&
          assignments.slice(0, 4).map((assignment) => (
            <div
              key={assignment.assignmentId}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {assignment.assignmentName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {assignment.courseCode}
                    {assignment.courseName ? ` · ${assignment.courseName}` : ""}
                  </div>
                  {assignment.statusLabel && (
                    <div className="mt-1 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {assignment.statusLabel}
                    </div>
                  )}
                </div>
                {assignment.nextEventLabel && assignment.nextEventDate && (
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <div>{assignment.nextEventLabel}</div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {assignment.nextEventDate}
                    </div>
                    {assignment.nextEventTime && (
                      <div>{assignment.nextEventTime}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                  <i className="fas fa-user-plus mr-1" />
                  {assignment.unmarkedCount} awaiting marking
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                  <i className="fas fa-pencil-alt mr-1" />
                  {assignment.draftCount} drafts in progress
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                  <i className="fas fa-check mr-1" />
                  {assignment.submittedCount} submitted
                </span>
                {typeof assignment.availableSessions === "number" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                    <i className="fas fa-calendar-plus mr-1" />
                    {assignment.availableSessions} slots need examiners
                  </span>
                )}
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                <Link
                  href={`${scheduleHref}/${assignment.assignmentId}`}
                  className="inline-flex"
                >
                  <Button size="sm" variant="secondary" className="border-blue-200 dark:border-blue-700">
                    <i className="fas fa-calendar mr-2" />
                    Manage sessions
                  </Button>
                </Link>
                <Link
                  href={`${resultsHref}?assignmentId=${assignment.assignmentId}`}
                  className="inline-flex"
                >
                  <Button size="sm" variant="outline">
                    <i className="fas fa-poll mr-2" />
                    View submissions
                  </Button>
                </Link>
              </div>
            </div>
          ))}

        {!isLoading && assignments.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No outstanding actions detected.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
