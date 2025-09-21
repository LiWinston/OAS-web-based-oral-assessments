"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Spinner } from "../../ui/spinner";

const statusStyles = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  IN_PROGRESS:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  UNKNOWN: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const statusLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  UNKNOWN: "Unknown",
};

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "—";
  }
}

function normalizeProgress(progress, status) {
  if (typeof progress === "number" && Number.isFinite(progress)) {
    if (progress < 0) return 0;
    if (progress > 100) return 100;
    return Math.round(progress);
  }

  switch (status) {
    case "COMPLETED":
      return 100;
    case "IN_PROGRESS":
      return 60;
    case "CANCELLED":
      return 0;
    default:
      return 15;
  }
}

function deriveNextAction(assignment) {
  const courseId = assignment.courseId || assignment.subjectId;
  if (!courseId) {
    return {
      label: "View Course",
      href: "/admin/courses",
    };
  }

  if (assignment.status === "PENDING") {
    return {
      label: "Configure Rubric",
      href: `/admin/courses/${courseId}/assignments/${assignment.id}/rubric`,
    };
  }

  if (assignment.status === "IN_PROGRESS") {
    return {
      label: "Manage Schedule",
      href: `/admin/courses/${courseId}/assignments/${assignment.id}/timeslots`,
    };
  }

  if (assignment.status === "COMPLETED") {
    return {
      label: "Review Results",
      href: `/admin/courses/${courseId}/assignments/${assignment.id}/results`,
    };
  }

  return {
    label: "View Assignment",
    href: `/admin/courses/${courseId}/assignments`,
  };
}

export function AssignmentStatusTable({
  assignments = [],
  loading = false,
  error = "",
  warnings = [],
  onRefresh,
}) {

  const displayAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];

    return assignments
      .slice()
      .sort((a, b) => {
        const aDate = a.endDate || a.dueDate || a.updateTime || a.createTime;
        const bDate = b.endDate || b.dueDate || b.updateTime || b.createTime;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(aDate) - new Date(bDate);
      })
      .slice(0, 5);
  }, [assignments]);

  return (
    <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Assignment Status Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            {typeof onRefresh === "function" && (
              <Button variant="outline" size="sm" onClick={onRefresh} title="Refresh assignment data">
                <i className="fas fa-sync mr-1"></i>
                Refresh
              </Button>
            )}
            <Link href="/admin/courses">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </div>
        {(error || (warnings && warnings.length > 0)) && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-300">
            {error || `Some assignments could not be loaded (${warnings.join(", ")}).`}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Next Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center text-sm text-gray-500 dark:text-gray-300">
                      <Spinner className="w-6 h-6 mb-2" />
                      Loading assignment overview…
                    </div>
                  </td>
                </tr>
              )}

              {!loading && displayAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <i className="fas fa-clipboard-list text-4xl mb-2"></i>
                      <p className="mb-2 font-medium">No assignments found</p>
                      <p className="text-sm">
                        Create your first assignment from the courses page to see it here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                displayAssignments.map((assignment) => {
                  const rawStatus = assignment.status || "";
                  const normalizedStatus = statusStyles[rawStatus?.toUpperCase?.()] ? rawStatus.toUpperCase() : "UNKNOWN";
                  const progress = normalizeProgress(
                    assignment.progress,
                    normalizedStatus
                  );
                  const progressLabel = `${progress}%`;
                  const nextAction = deriveNextAction(assignment);

                  return (
                    <tr
                      key={`${assignment.id}-${assignment.courseId || assignment.subjectId}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {assignment.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {formatDate(assignment.endDate || assignment.dueDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize text-sm text-gray-900 dark:text-gray-100">
                        {assignment.type || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            statusStyles[normalizedStatus]
                          }`}
                        >
                          {statusLabels[normalizedStatus]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[3rem]">
                            {progressLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {assignment.courseCode || assignment.courseName || "—"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Weight: {assignment.weight != null ? `${assignment.weight}%` : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={nextAction.href}>
                          <Button variant="outline" size="sm">
                            {nextAction.label}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
