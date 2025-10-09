"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Spinner } from "../../ui/spinner";
import useAuthStore from "../../../store/authStore";
import studentBookingServiceReal from "../../../services/studentBookingReal";

/**
 * UpcomingAssessments Component
 *
 * Real data: fetches student assignments (booked + bookable) and renders
 * status-aware items with session details or booking deadline when available.
 */
export function UpcomingAssessments() {
  const { user } = useAuthStore();
  const studentId = user?.id;
  const [items, setItems] = useState([]); // normalized items
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch booked and bookable in parallel
        const [bookedRes, bookableRes] = await Promise.all([
          studentBookingServiceReal.getStudentAssignments(studentId, {
            status: "booked",
            pageNum: 0,
            pageSize: 50,
            sort: "date_asc",
          }),
          studentBookingServiceReal.getStudentAssignments(studentId, {
            status: "bookable",
            pageNum: 0,
            pageSize: 50,
            sort: "date_asc",
          }),
        ]);

        const booked = (bookedRes?.data?.data || []).slice(0, 5);
        const bookable = (bookableRes?.data?.data || []).slice(0, 5);

        // Enrich booked with current booking session; enrich bookable with availability
        const enrichBooked = await Promise.all(
          booked.map(async (a) => {
            try {
              const cur = await studentBookingServiceReal.getCurrentBooking(
                a.assignmentId,
                studentId
              );
              const booking = cur?.data?.booking;
              return normalizeAssignment(a, {
                status: "booked",
                session: booking?.session,
                entity: booking?.entity,
              });
            } catch {
              return normalizeAssignment(a, { status: "booked" });
            }
          })
        );

        const enrichBookable = await Promise.all(
          bookable.map(async (a) => {
            try {
              const avail = await studentBookingServiceReal.getAssignmentAvailability(
                a.assignmentId,
                studentId
              );
              const av = avail?.data;
              return normalizeAssignment(a, {
                status: "booking_required",
                bookingDeadline: av?.bookingDeadline,
              });
            } catch {
              return normalizeAssignment(a, { status: "booking_required" });
            }
          })
        );

        // Merge with booked first; limit total displayed to 6
        const merged = [...enrichBooked, ...enrichBookable].slice(0, 6);

        if (mounted) setItems(merged);
      } catch (e) {
        console.error("Failed to load upcoming assessments:", e);
        if (mounted) setError(e?.message || "Failed to load upcoming assessments");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "booked":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <i className="fas fa-check-circle mr-1"></i>
            Booked
          </span>
        );
      case "booking_required":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <i className="fas fa-exclamation-circle mr-1"></i>
            Booking Required
          </span>
        );
      default:
        return null;
    }
  };

  const getActionButton = (assessment) => {
    if (assessment.status === "booked") {
      return (
        <Link href={`/student/booking`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      );
    }
    return (
      <Link href={`/student/booking/${assessment.id}`}>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          Book Now
        </Button>
      </Link>
    );
  };

  const formatDisplayDate = (sessionStart) => {
    if (!sessionStart) return { month: "TBD", day: "--" };
    const d = new Date(sessionStart);
    if (isNaN(d.getTime())) return { month: "TBD", day: "--" };
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const day = d.getDate();
    return { month, day };
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-calendar-day text-blue-600 dark:text-blue-400 mr-2"></i>
            Your Upcoming Assessments
          </CardTitle>
          <Link
            href="/student/booking"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-5 h-5 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading…</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <i className="fas fa-exclamation-triangle text-2xl text-red-500 mb-2"></i>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <i className="fas fa-calendar text-2xl text-gray-400 mb-2"></i>
            <p className="text-sm text-gray-600 dark:text-gray-400">No upcoming actions</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">New assessments will appear here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((assessment) => {
              const { month, day } = formatDisplayDate(assessment.sessionStart || assessment.date);
              return (
                <li key={assessment.id} className="py-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{month}</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{day}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {assessment.title}
                      </p>
                      <div className="mt-1 flex items-center flex-wrap gap-2">
                        {assessment.time && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <i className="fas fa-clock mr-1"></i>
                            {assessment.time}
                          </span>
                        )}
                        {assessment.venue && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {assessment.venue}
                          </span>
                        )}
                        {assessment.type && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            <i className={`fas ${assessment.type.includes("Group") ? "fa-users" : "fa-user"} mr-1`}></i>
                            {assessment.type}
                          </span>
                        )}
                      </div>

                      {assessment.groupMembers?.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Group:</span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {assessment.groupMembers.join(", ")}
                          </span>
                        </div>
                      )}

                      {assessment.status === "booking_required" && assessment.bookingDeadline && (
                        <div className="mt-2">
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            Booking deadline: {formatDeadline(assessment.bookingDeadline)}
                          </span>
                        </div>
                      )}

                      <div className="mt-2 flex">{getStatusBadge(assessment.status)}</div>
                    </div>

                    <div className="flex-shrink-0">{getActionButton(assessment)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/student/booking"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View booking options
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeAssignment(a, extra) {
  const typeLabel = a.assessmentType === "GROUP" ? "Group Assessment" : a.assessmentType === "MIXED" ? "Mixed Assessment" : "Individual Assessment";
  const title = `${a.courseCode || ""}${a.courseCode ? " • " : ""}${a.assignmentName || "Assessment"}`;
  let time, venue, sessionStart;
  const s = extra?.session;
  if (s?.start && s?.end) {
    try {
      const st = new Date(s.start);
      const en = new Date(s.end);
      const tf = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      time = `${tf(st)} - ${tf(en)}`;
      sessionStart = s.start;
    } catch (_e) {}
  }
  if (s?.venue) {
    venue = s.venue.name || s.venue.room || s.venue.venueName;
  }
  return {
    id: a.assignmentId,
    title,
    course: a.courseCode,
    type: typeLabel,
    status: extra?.status,
    time,
    venue,
    sessionStart,
    bookingDeadline: extra?.bookingDeadline,
    groupMembers: extra?.groupMembers,
  };
}

function formatDeadline(deadlineIso) {
  try {
    const d = new Date(deadlineIso);
    return d.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return deadlineIso;
  }
}
