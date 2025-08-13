"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

/**
 * Mock data for weekly calendar events
 */
const mockWeeklyEvents = {
  10: [
    { id: 1, title: "COMP90082 #8", time: "9:30", status: "completed" },
    { id: 2, title: "INFO30005 #2", time: "11:15", status: "completed" },
  ],
  11: [{ id: 3, title: "INFO20003 #1", time: "13:45", status: "completed" }],
  12: [
    { id: 4, title: "COMP90082 #9", time: "10:00", status: "completed" },
    { id: 5, title: "INFO30005 #4", time: "14:30", status: "completed" },
  ],
  13: [
    { id: 6, title: "COMP90082 #12", time: "10:30", status: "upcoming" },
    { id: 7, title: "INFO30005 #5", time: "14:00", status: "upcoming" },
    { id: 8, title: "INFO20003 #6", time: "16:15", status: "upcoming" },
  ],
  14: [
    { id: 9, title: "COMP90082 #15", time: "9:00", status: "upcoming" },
    { id: 10, title: "COMP90082 #16", time: "10:00", status: "upcoming" },
  ],
  15: [{ id: 11, title: "INFO30005 #7", time: "11:30", status: "upcoming" }],
  16: [],
};

/**
 * Status styling configuration for calendar event badges
 */
const statusStyles = {
  upcoming: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  active:
    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  completed: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
};

/**
 * WeeklyCalendar Component
 *
 * Displays a compact weekly calendar view showing the examiner's assessment schedule
 * for the current week. Each day shows assessment events with color-coded status indicators
 * and provides a quick overview of the week's workload distribution.
 */
export function WeeklyCalendar() {
  const today = 13; // Current day for demo
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDates = [10, 11, 12, 13, 14, 15, 16];

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-week text-purple-600 dark:text-purple-400 mr-2"></i>{" "}
            This Week
          </CardTitle>
          <Link
            href="/examiner/schedule"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Monthly View
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Calendar header */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-1"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {weekDates.map((date) => {
            const isToday = date === today;
            const events = mockWeeklyEvents[date] || [];

            return (
              <div
                key={date}
                className={`calendar-day ${
                  isToday
                    ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                    : ""
                }`}
              >
                <div
                  className={`text-xs mb-1 ${
                    isToday
                      ? "font-medium text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {date} {isToday ? "(Today)" : ""}
                </div>

                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 mb-1 rounded truncate block ${
                      statusStyles[event.status]
                    }`}
                    title={`${event.title} at ${event.time}`}
                  >
                    {event.title} ({event.time})
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900 mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900 mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
