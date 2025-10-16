"use client";
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAuth from "@/hooks/useAuth";
import { studentBookingServiceReal as studentBookingService } from "@/services/studentBookingReal";
import { useRouter } from "next/navigation";

export default function StudentCalendar() {
  const { user, isAuthenticated } = useAuth();
  const studentId = user?.id || user?.userId || user?.studentId;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const router = useRouter();

  const monthStart = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    [currentMonth]
  );
  const monthEnd = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
    [currentMonth]
  );
  const calendarRange = useMemo(() => {
    const start = new Date(monthStart.getTime());
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(monthEnd.getTime());
    end.setDate(end.getDate() + (6 - end.getDay()));
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [monthStart, monthEnd]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["studentCalendarBookings", studentId, currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: () => studentBookingService.getMyBookings(studentId, { status: "upcoming", pageNum: 0, pageSize: 200 }),
    enabled: isAuthenticated && Boolean(studentId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const allBookings = data?.data?.data || [];
  const { start: calendarStart, end: calendarEnd } = calendarRange;
  const bookingEvents = useMemo(() => {
    if (!calendarStart || !calendarEnd) return [];
    return allBookings
      .filter((b) => {
        const s = new Date(b.session?.start);
        return s >= calendarStart && s <= calendarEnd;
      })
      .map((b) => ({
        type: "booked",
        assignmentId: b.assignmentId,
        assignmentName: b.assignmentName,
        courseCode: b.courseCode,
        courseName: b.courseName,
        start: b.session.start,
        end: b.session.end,
        venue: b.session.venue,
        entity: b.entity,
      }));
  }, [allBookings, calendarStart, calendarEnd]);

  // Fetch assignments that are bookable, then aggregate availability days for current month
  const { data: bookableAssignmentsRes } = useQuery({
    queryKey: ["calendarBookableAssignments", studentId],
    queryFn: () => studentBookingService.getStudentAssignments(studentId, { status: "bookable", pageNum: 0, pageSize: 200, sort: "date_asc" }),
    enabled: isAuthenticated && Boolean(studentId),
    staleTime: 30 * 1000,
  });

  const { data: availabilityDaysRes, isLoading: isLoadingAvailability } = useQuery({
    queryKey: [
      "calendarAvailabilities",
      studentId,
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      bookableAssignmentsRes?.data?.data?.length || 0,
      bookingEvents.length,
    ],
    enabled: isAuthenticated && Boolean(studentId) && Array.isArray(bookableAssignmentsRes?.data?.data),
    queryFn: async () => {
      const rawItems = bookableAssignmentsRes?.data?.data || [];
      const bookedIds = new Set(bookingEvents.map((b) => b.assignmentId));
      // Filter to truly bookable (defensive against stale status from backend)
      const items = rawItems.filter((a) => {
        if (!a?.availability?.released) return false;
        const avail = typeof a?.availability?.availableSessions === 'number' ? a.availability.availableSessions : 1;
        if (avail <= 0) return false;
        if (a?.booking?.hasActiveBooking) return false;
        if (bookedIds.has(a.assignmentId)) return false;
        return true;
      });
      const results = await Promise.all(
        items.map(async (a) => {
          try {
            const res = await studentBookingService.getAssignmentAvailability(a.assignmentId, studentId);
            const days = res?.data?.summary?.daysWithAvailability || [];
            return { assignmentId: a.assignmentId, assignmentName: a.assignmentName, days };
          } catch {
            return { assignmentId: a.assignmentId, assignmentName: a.assignmentName, days: [] };
          }
        })
      );
      return results;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const availableEvents = useMemo(() => {
    if (!Array.isArray(availabilityDaysRes)) return [];
    return availabilityDaysRes.flatMap((r) =>
      (r.days || [])
        .filter((d) => {
          const [y, m, day] = d.split("-").map(Number);
          const date = new Date(y, m - 1, day);
          return date >= calendarStart && date <= calendarEnd;
        })
        .map((d) => ({ type: "available", date: d, assignmentId: r.assignmentId, assignmentName: r.assignmentName }))
    );
  }, [availabilityDaysRes, calendarStart, calendarEnd]);

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + direction);
      return d;
    });
  };

  const goToToday = () => setCurrentMonth(new Date());

  const getDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: prevMonth.getDate() - i, isCurrentMonth: false, fullDate: new Date(year, month - 1, prevMonth.getDate() - i) });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: day, isCurrentMonth: true, fullDate: new Date(year, month, day) });
    }
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push({ date: day, isCurrentMonth: false, fullDate: new Date(year, month + 1, day) });
    }
    return days;
  };

  const toLocalYMD = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  const getBookedFor = (date) => {
    const ds = toLocalYMD(date);
    return bookingEvents.filter((e) => toLocalYMD(new Date(e.start)) === ds);
  };
  const getAvailableFor = (date) => {
    const ds = toLocalYMD(date);
    return availableEvents.filter((e) => e.date === ds);
  };

  const days = getDays(currentMonth);

  return (
    <div className="dashboard-card mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
            onClick={() => navigateMonth(-1)}
            aria-label="Previous month"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <button
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
            onClick={() => navigateMonth(1)}
            aria-label="Next month"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          <button
            onClick={goToToday}
            className="ml-3 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-200"
          >
            Today
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
          {isLoading
            ? "Loading…"
            : error
            ? "Failed to load"
            : `${bookingEvents.length + availableEvents.length} items`}
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center font-medium">
              {d}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-200 border border-green-300" />
            <span>Assignments Available to Book</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
            <span>My Bookings</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, idx) => {
            const booked = d.isCurrentMonth ? getBookedFor(d.fullDate) : [];
            const avail = d.isCurrentMonth ? getAvailableFor(d.fullDate) : [];
            const isToday = new Date().toDateString() === d.fullDate.toDateString();
            return (
              <div
                key={idx}
                className={`min-h-24 p-2 rounded-md border ${
                  d.isCurrentMonth ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isToday ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-700 dark:text-gray-300"}`}>{d.date}</span>
                  {(booked.length + avail.length) > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {booked.length + avail.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {/* Available to book */}
                  {avail.slice(0, 2).map((a, i) => (
                    <button
                      key={`a-${i}`}
                      onClick={() => router.push(`/student/booking/${a.assignmentId}`)}
                      className="w-full text-left text-[11px] truncate px-1 py-0.5 rounded border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30"
                      title={`Book: ${a.assignmentName}`}
                    >
                      Available · {a.assignmentName}
                    </button>
                  ))}
                  {/* My bookings */}
                  {booked.slice(0, 2).map((e, i) => (
                    <button
                      key={`b-${i}`}
                      onClick={() => router.push(`/student/booking/${e.assignmentId}/confirmation`)}
                      className="w-full text-left text-[11px] truncate px-1 py-0.5 rounded border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      title={`View booking: ${e.assignmentName}`}
                    >
                      {new Date(e.start).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true })} · {e.assignmentName}
                    </button>
                  ))}
                  {(avail.length + booked.length) > 4 && (
                    <div className="text-[10px] text-gray-500">+{avail.length + booked.length - 4} more…</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
