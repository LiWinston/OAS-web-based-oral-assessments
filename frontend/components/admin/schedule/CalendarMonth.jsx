'use client';

import { useState, useMemo } from 'react';
import { useCalendar } from '@/hooks/useCalendar.js';

/**
 * CalendarMonth - Dynamic calendar component for timeslot management
 * Consumes useCalendar hook, not hard-coded month or fixed "today"
 */

export default function CalendarMonth({ assignmentId, selectedDate, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const {
    data: calendarData,
    isLoading,
    getStatusForDate,
    getSlotCountForDate
  } = useCalendar(assignmentId, currentMonth);

  // Calculate today for highlighting
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Parse current month for display and calendar generation
  const [year, month] = currentMonth.split('-').map(Number);
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const calendarDays = [];

  // Previous month days (for padding)
  for (let i = 0; i < firstDayOfMonth; i++) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    const day = daysInPrevMonth - firstDayOfMonth + i + 1;
    calendarDays.push({
      day,
      date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false,
      isToday: false
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      day,
      date: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === today
    });
  }

  const navigateMonth = (direction) => {
    const currentDate = new Date(year, month - 1, 1);
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const handleDateClick = (dateStr, isCurrentMonth) => {
    if (isCurrentMonth) {
      onDateSelect?.(dateStr);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-card p-5">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400 mr-2" />
          {monthName}
        </h2>
        <div className="flex items-center space-x-2">
          <button 
            className="calendar-nav-btn text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => navigateMonth('prev')}
            title="Previous month"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button 
            className="calendar-nav-btn text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => navigateMonth('next')}
            title="Next month"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      {/* Calendar header - days of week */}
      <div className="calendar-container mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-xs text-center font-medium text-gray-500 dark:text-gray-400 p-2">
            {d}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="calendar-container">
        {calendarDays.map((dayInfo, index) => {
          const rawStatus = dayInfo.isCurrentMonth ? getStatusForDate(dayInfo.date) : null;
          const status = rawStatus || 'empty';
          const count = dayInfo.isCurrentMonth ? getSlotCountForDate(dayInfo.date) : 0;
          const dayData = dayInfo.isCurrentMonth ? (calendarData?.[dayInfo.date] || {}) : {};
          const fullyCount = Number(dayData.fullyStaffed || 0);
          const partialCount = Number(dayData.partialStaffed || 0);
          const noneCount = Number(dayData.noStaffed || 0);
          const isSelected = selectedDate === dayInfo.date;
          
          return (
            <div
              key={`${dayInfo.date}-${index}`}
              className={`calendar-day ${
                !dayInfo.isCurrentMonth 
                  ? 'text-gray-300 dark:text-gray-600' 
                  : ''
              } ${
                isSelected ? 'selected' : ''
              } ${
                dayInfo.isToday ? 'border-2 border-blue-400' : ''
              } ${
                dayInfo.isCurrentMonth ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : 'cursor-default'
              }`}
              onClick={() => handleDateClick(dayInfo.date, dayInfo.isCurrentMonth)}
              role={dayInfo.isCurrentMonth ? "button" : undefined}
              aria-label={dayInfo.isCurrentMonth ? `Select ${dayInfo.date}` : undefined}
            >
              <span className="date">{dayInfo.day}</span>
              {(fullyCount + partialCount + noneCount) > 0 && (
                <div className="day-status flex flex-col items-start gap-1">
                  {fullyCount > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="legend-dot bg-green-500" />
                      <span className="slot-count text-xs text-gray-700 dark:text-gray-300">{fullyCount}</span>
                    </div>
                  )}
                  {partialCount > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="legend-dot bg-yellow-500" />
                      <span className="slot-count text-xs text-gray-700 dark:text-gray-300">{partialCount}</span>
                    </div>
                  )}
                  {noneCount > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="legend-dot bg-red-500" />
                      <span className="slot-count text-xs text-gray-700 dark:text-gray-300">{noneCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend (always show 3 kinds for helper) */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Legend</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="legend-item">
            <div className="legend-dot bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Fully Staffed</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot bg-yellow-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Partially Staffed</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Unstaffed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
