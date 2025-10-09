"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

function renderSkeleton(count = 3) {
  return Array.from({ length: count }).map((_, idx) => (
    <div
      key={`recent-skeleton-${idx}`}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/30 p-3 space-y-2 animate-pulse"
    >
      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  ));
}

export function RecentResults({
  items = [],
  isLoading = false,
  resultsHref = "/examiner/results",
}) {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clipboard-check text-green-600 dark:text-green-400 mr-2" />
            Recent Submissions
          </CardTitle>
          <Link
            href={resultsHref}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {isLoading && renderSkeleton()}

        {!isLoading &&
          items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-3 shadow-sm"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.courseCode}
                    {item.entity ? ` · ${item.entity}` : ""}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.status === "RELEASED"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                      : item.status === "SUBMITTED"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  {item.statusLabel}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{item.submittedAt}</span>
                {item.scoreLabel && <span>{item.scoreLabel}</span>}
              </div>
            </div>
          ))}

        {!isLoading && items.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-6">
            No submissions yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
