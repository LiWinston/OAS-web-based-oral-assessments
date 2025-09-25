'use client';

import { useEffect, useMemo, useState } from 'react';
import { courseAdminSessionService } from '@/services/courseAdminSessionService.js';

const normaliseDateOnly = (value) => {
  if (!value) return null;
  const ensureDate = (input) => {
    if (input instanceof Date && !Number.isNaN(input.getTime())) {
      return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }
    if (typeof input === 'string') {
      const base = input.includes('T') ? input.split('T')[0] : input;
      const parts = base.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map((n) => Number.parseInt(n, 10));
        if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
          return new Date(y, m - 1, d);
        }
      }
      const parsed = new Date(input);
      if (!Number.isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      }
      return null;
    }
    if (typeof input === 'number') {
      const parsed = new Date(input);
      if (!Number.isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      }
    }
    return null;
  };

  return ensureDate(value);
};

/**
 * CalendarMonth - Dynamic calendar component for timeslot management
 * Consumes useCalendar hook, not hard-coded month or fixed "today"
 */

export default function CalendarMonth({ assignmentId, selectedDate, onDateSelect, disableFetch = false, refreshKey = 0, minDate = null, maxDate = null }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [calendarData, setCalendarData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const minDateObj = useMemo(() => normaliseDateOnly(minDate), [minDate]);
  const maxDateObj = useMemo(() => normaliseDateOnly(maxDate), [maxDate]);
  const getStatusForDate = (date) => {
    const d = calendarData?.[date];
    if (!d) return null;
    if (d.fullyStaffed > 0) return 'full';
    if (d.partialStaffed > 0) return 'partial';
    if (d.noStaffed > 0) return 'empty';
    return null;
  };
  const getSlotCountForDate = (date) => {
    const d = calendarData?.[date];
    if (!d) return 0;
    return Number(d.fullyStaffed || 0) + Number(d.partialStaffed || 0) + Number(d.noStaffed || 0);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (disableFetch || !assignmentId || !currentMonth) return;
      setIsLoading(true);
      try {
        const res = await courseAdminSessionService.getSessionsCalendar(assignmentId, currentMonth);
        if (!cancelled) setCalendarData(res?.data || {});
      } catch {
        if (!cancelled) setCalendarData({});
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [assignmentId, currentMonth, disableFetch, refreshKey]);

  // Calculate today for highlighting
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Parse current month for display and calendar generation
  const [year, month] = currentMonth.split('-').map(Number);
  // Avoid locale-dependent formatting to prevent hydration mismatch
  const MONTH_NAMES = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ];
  const monthName = `${MONTH_NAMES[(month - 1 + 12) % 12]} ${year}`;

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

  return (
    <div className="dashboard-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400 mr-2" />
          {monthName}
          {isLoading && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></span>
              Updating
            </span>
          )}
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
          const dateObj = normaliseDateOnly(dayInfo.date);
          const isDisabled = dayInfo.isCurrentMonth && (
            (minDateObj && dateObj && dateObj < minDateObj) ||
            (maxDateObj && dateObj && dateObj > maxDateObj)
          );
          const canSelect = dayInfo.isCurrentMonth && !isDisabled;

          const dayClass = [
            'calendar-day',
            !dayInfo.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : '',
            isSelected ? 'selected' : '',
            dayInfo.isToday ? 'border-2 border-blue-400' : '',
            dayInfo.isCurrentMonth
              ? canSelect
                ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-500'
              : 'cursor-default'
          ].filter(Boolean).join(' ');

          return (
            <div
              key={`${dayInfo.date}-${index}`}
              className={dayClass}
              onClick={() => { if (canSelect) onDateSelect?.(dayInfo.date); }}
              role={canSelect ? 'button' : undefined}
              aria-label={canSelect ? `Select ${dayInfo.date}` : undefined}
              aria-disabled={canSelect ? undefined : true}
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
