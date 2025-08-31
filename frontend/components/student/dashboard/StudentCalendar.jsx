"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

/**
 * StudentCalendar Component
 *
 * Displays a monthly calendar view with assessment dates highlighted
 * and color-coded status indicators.
 */
export function StudentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 1)); // April 2025

  // Mock assessment data - will be replaced with real data from API
  const assessmentDates = {
    "2025-04-15": { type: "booked", title: "SPM Final Presentation" },
    "2025-04-18": { type: "needs_booking", title: "Web Info Tech Evaluation" },
    "2025-04-25": { type: "needs_booking", title: "IT Project Defense" },
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: prevMonthDay.toISOString().split("T")[0],
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day).toISOString().split("T")[0];
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: fullDate,
        assessment: assessmentDates[fullDate],
      });
    }

    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - days.length; // 6 rows × 7 days = 42 cells
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: nextMonthDay.toISOString().split("T")[0],
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getDayClasses = (day) => {
    let classes =
      "w-10 h-10 flex items-center justify-center text-sm rounded-full transition-colors cursor-pointer ";

    if (!day.isCurrentMonth) {
      classes += "text-gray-400 dark:text-gray-600 ";
    } else {
      classes +=
        "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 ";

      // Check if this is today
      const today = new Date().toISOString().split("T")[0];
      if (day.fullDate === today) {
        classes += "bg-blue-600 text-white hover:bg-blue-700 ";
      }

      // Check for assessments
      if (day.assessment) {
        if (day.assessment.type === "booked") {
          classes +=
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 font-medium ";
        } else if (day.assessment.type === "needs_booking") {
          classes +=
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-medium ";
        }
      }
    }

    return classes;
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar text-indigo-600 dark:text-indigo-400 mr-2"></i>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(-1)}
              className="p-2"
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(1)}
              className="p-2"
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Calendar header */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={getDayClasses(day)}
              title={day.assessment ? day.assessment.title : ""}
            >
              {day.date}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full inline-block mr-2"></span>
              <span>Today</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block mr-2"></span>
              <span>Booked</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full inline-block mr-2"></span>
              <span>Needs Booking</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
