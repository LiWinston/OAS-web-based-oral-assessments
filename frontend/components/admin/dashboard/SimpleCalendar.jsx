"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

// Mock calendar events - will be replaced with real data
const mockEvents = [
  {
    date: "2025-06-08",
    title: "Data Structures Oral",
    type: "exam",
    time: "10:00 AM",
    priority: "high",
  },
  {
    date: "2025-06-10",
    title: "Algorithm Presentations",
    type: "presentation",
    time: "2:00 PM",
    priority: "medium",
  },
  {
    date: "2025-06-15",
    title: "Software Engineering Viva",
    type: "viva",
    time: "9:00 AM",
    priority: "high",
  },
];

const eventColors = {
  exam: {
    bg: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
    border: "border-l-4 border-blue-500",
    icon: "fas fa-clipboard-list text-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  presentation: {
    bg: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    border: "border-l-4 border-green-500",
    icon: "fas fa-presentation text-green-500",
    gradient: "from-green-500 to-emerald-500",
  },
  viva: {
    bg: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
    border: "border-l-4 border-purple-500",
    icon: "fas fa-microphone text-purple-500",
    gradient: "from-purple-500 to-purple-600",
  },
};

export function SimpleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Generate calendar days
  const calendarDays = [];

  // Previous month's trailing days
  for (let i = 0; i < firstDay; i++) {
    const prevDate = new Date(year, month, 0 - (firstDay - 1 - i));
    calendarDays.push({
      date: prevDate.getDate(),
      isCurrentMonth: false,
      fullDate: prevDate.toISOString().split("T")[0],
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = new Date(year, month, day).toISOString().split("T")[0];
    calendarDays.push({
      date: day,
      isCurrentMonth: true,
      isToday: fullDate === today.toISOString().split("T")[0],
      fullDate,
    });
  }

  // Next month's leading days to fill the grid
  const remainingCells = 42 - calendarDays.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, month + 1, day);
    calendarDays.push({
      date: day,
      isCurrentMonth: false,
      fullDate: nextDate.toISOString().split("T")[0],
    });
  }

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return mockEvents.filter((event) => event.date === date);
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
    <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-3">
              <i className="fas fa-calendar-alt text-white text-sm"></i>
            </div>
            Assessment Calendar
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
      </CardHeader>
      <CardContent>
        {/* Enhanced Calendar header */}
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

        {/* Enhanced Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {calendarDays.slice(0, 35).map((day, index) => {
            const events = getEventsForDate(day.fullDate);
            return (
              <div
                key={index}
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
              >
                {/* Date number */}
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

                {/* Events */}
                <div className="space-y-1">
                  {events.slice(0, 2).map((event, eventIndex) => {
                    const eventStyle = eventColors[event.type];
                    return (
                      <div
                        key={eventIndex}
                        className={`
                          calendar-event text-xs p-1 rounded-md cursor-pointer 
                          ${eventStyle.bg} ${eventStyle.border}
                          hover:opacity-80 transition-all duration-200 transform hover:scale-105
                          animate-fadeInUp group-hover:shadow-sm
                        `}
                        style={{ animationDelay: `${eventIndex * 100}ms` }}
                        title={`${event.title} at ${event.time}`}
                      >
                        <div className="flex items-center">
                          <i
                            className={`${eventStyle.icon
                              .split(" ")
                              .slice(0, 2)
                              .join(" ")} mr-1 text-xs`}
                          ></i>
                          <span className="truncate font-medium">
                            {event.title}
                          </span>
                        </div>
                        <div className="text-xs opacity-75 mt-0.5">
                          {event.time}
                        </div>
                      </div>
                    );
                  })}

                  {/* Show "+X more" if there are additional events */}
                  {events.length > 2 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                      +{events.length - 2} more
                    </div>
                  )}
                </div>

                {/* Today indicator */}
                {day.isToday && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Enhanced Calendar legend */}
        <div className="flex flex-wrap gap-4 text-xs border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center group cursor-pointer">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded-sm mr-2 group-hover:scale-110 transition-transform"></div>
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
              Oral Exams ({mockEvents.filter((e) => e.type === "exam").length})
            </span>
          </div>
          <div className="flex items-center group cursor-pointer">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 rounded-sm mr-2 group-hover:scale-110 transition-transform"></div>
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
              Presentations (
              {mockEvents.filter((e) => e.type === "presentation").length})
            </span>
          </div>
          <div className="flex items-center group cursor-pointer">
            <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500 rounded-sm mr-2 group-hover:scale-110 transition-transform"></div>
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
              Viva Voce ({mockEvents.filter((e) => e.type === "viva").length})
            </span>
          </div>
        </div>

        {/* Enhanced footer with tips */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <i className="fas fa-info-circle mr-2 text-blue-500"></i>
              <span>Click on any date to view detailed schedule</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                Today
              </span>
              <span className="flex items-center">
                <i className="fas fa-calendar-check mr-1 text-green-500"></i>
                {mockEvents.length} Events
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
