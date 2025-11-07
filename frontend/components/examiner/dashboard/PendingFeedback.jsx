"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

const urgencyMeta = {
  OVERDUE: {
    label: "Due today",
    badgeClass: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    buttonClass: "bg-red-600 hover:bg-red-700 text-white",
    icon: "fa-exclamation-circle",
  },
  DUE_SOON: {
    label: "Due soon",
    badgeClass: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
    icon: "fa-hourglass-half",
  },
  UPCOMING: {
    label: "Upcoming",
    badgeClass: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
    icon: "fa-clock",
  },
  COMPLETED: {
    label: "Submitted",
    badgeClass: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    buttonClass: "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    icon: "fa-check-circle",
  },
};

function renderSkeletonItems(count = 3) {
  return Array.from({ length: count }).map((_, idx) => (
    <div
      key={`pending-skeleton-${idx}`}
      className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
    >
      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-52 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-44 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
      <div className="mt-4 h-6 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
    </div>
  ));
}

export function PendingFeedback({
  items = [],
  isLoading = false,
  workspaceHref = "/examiner/assessment",
}) {
  const [expanded, setExpanded] = useState(false);
  const overdueCount = items.filter((item) => item.urgency === "OVERDUE").length;
  const visibleItems = useMemo(
    () => (expanded ? items : items.slice(0, 4)),
    [expanded, items]
  );

  useEffect(() => {
    if (items.length <= 4 && expanded) {
      setExpanded(false);
    }
  }, [items.length, expanded]);

  const handleToggleExpanded = (event) => {
    event.preventDefault();
    setExpanded((prev) => !prev);
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-clipboard-check text-blue-600 dark:text-blue-400 mr-2" />
            Marking Queue
          </CardTitle>
          {items.length > 0 && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {overdueCount} due today
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider delayDuration={150}>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading && renderSkeletonItems()}

          {!isLoading &&
            visibleItems.map((item) => {
              const urgency = urgencyMeta[item.urgency] ?? urgencyMeta.UPCOMING;
              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="md:flex md:justify-between md:items-center gap-4">
                    <div className="mb-3 md:mb-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${urgency.badgeClass}`}
                        >
                          <i className={`fas ${urgency.icon} mr-1`} />
                          {urgency.label}
                        </span>
                        {item.timeLabel && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.timeLabel}
                          </span>
                        )}
                        {typeof item.isBooked === "boolean" && (
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              item.isBooked
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                            }`}
                          >
                            <i
                              className={`fas ${
                                item.isBooked ? "fa-user-check" : "fa-user"
                              } mr-1`}
                            />
                            {item.isBooked ? "Booked" : "Open slot"}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.courseCode}
                        {item.entity ? ` - ${item.entity}` : ""}
                      </div>
                      {(item.sessionTimeRange || item.venueLabel) && (
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                          {item.sessionTimeRange && (
                            <span className="inline-flex items-center gap-2">
                              <i className="fas fa-clock text-gray-400" />
                              {item.sessionTimeRange}
                            </span>
                          )}
                          {item.venueLabel && (
                            <span className="inline-flex items-center gap-2">
                              <i className="fas fa-map-marker-alt text-gray-400" />
                              {item.venueLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <i className="fas fa-calendar-alt text-gray-400 mr-2" />
                        {item.sessionDate}
                      </div>
                      {item.progressLabel && (
                        <div className="flex items-center">
                          <i className="fas fa-chart-line text-gray-400 mr-2" />
                          {item.progressLabel}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    {item.actionDisabled ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-not-allowed">
                            <Button
                              size="sm"
                              disabled
                              className={urgency.buttonClass}
                            >
                              <i className={`fas ${item.actionIcon || "fa-ban"} mr-2`} />
                              {item.actionLabel || "Open marking"}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="end">
                          {item.actionTooltip || "Session not booked yet. Marking opens once a student is scheduled."}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link href={item.actionHref || workspaceHref} className="inline-flex">
                        <Button size="sm" className={urgency.buttonClass}>
                          <i className={`fas ${item.actionIcon || "fa-arrow-right"} mr-2`} />
                          {item.actionLabel || "Open marking"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        {!isLoading && items.length > 4 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
              onClick={handleToggleExpanded}
            >
              {expanded ? "Show fewer items" : `View all ${items.length} items`}
            </Button>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <i className="fas fa-check-circle text-4xl mb-2 text-green-500" />
              <p>All marking up to date.</p>
            </div>
            <Link href={workspaceHref}>
              <Button variant="outline">Open marking workspace</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
