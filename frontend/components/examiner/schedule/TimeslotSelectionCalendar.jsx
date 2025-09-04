import React from 'react';
import { toLocalDateKey } from '@/utils/dateUtils';

export default function TimeslotSelectionCalendar({
  currentMonth,
  onNavigateMonth,
  availableDates = [],
  selectedDate,
  onSelectDate,
}) {
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: d,
        dateString: toLocalDateKey(d),
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: d,
        dateString: toLocalDateKey(d),
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const d = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: d,
        dateString: toLocalDateKey(d),
      });
    }

    return days;
  };

  const days = getDaysInMonth();
  const todayStr = toLocalDateKey(new Date());
  const availSet = new Set(availableDates);

  return (
    <div className="dashboard-card p-5 lg:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400 mr-2"></i>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => onNavigateMonth(-1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i className="fas fa-chevron-left text-gray-500"></i>
          </button>
          <button onClick={() => onNavigateMonth(1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <i className="fas fa-chevron-right text-gray-500"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-xs text-center font-medium text-gray-500 dark:text-gray-400 p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const hasSlots = availSet.has(day.dateString);
          const isSelected = selectedDate === day.dateString;
          const isToday = day.dateString === todayStr;
          return (
            <div
              key={index}
              className={`aspect-square flex flex-col items-center justify-center rounded cursor-pointer text-xs ${
                !day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''
              } ${hasSlots ? 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700' : ''} ${
                isSelected ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : ''
              } ${isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}
              onClick={() => hasSlots && onSelectDate(day.dateString)}
            >
              <span>{day.date}</span>
              {hasSlots && <div className="w-1 h-1 bg-blue-500 rounded-full mt-1"></div>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>Available slots</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 border border-blue-500 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-2"></div>
          <span>Selected date</span>
        </div>
      </div>
    </div>
  );
}
