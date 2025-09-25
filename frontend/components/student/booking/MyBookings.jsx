"use client";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "@/hooks/useAuth";
import { studentBookingServiceReal as studentBookingService } from "@/services/studentBookingReal";
import { useNotification } from "@/hooks/useNotification";
import { useRouter } from "next/navigation";
import ConfirmCancelDialog from "./ConfirmCancelDialog";

export default function MyBookings() {
  const { user, isAuthenticated } = useAuth();
  const studentId = user?.id || user?.userId || user?.studentId;
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["studentMyBookings", studentId],
    queryFn: () =>
      studentBookingService.getMyBookings(studentId, { status: "upcoming" }),
    enabled: isAuthenticated && Boolean(studentId),
    staleTime: 60 * 1000,
  });

  const bookings = data?.data?.data || [];

  const isUrlValue = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
  const extractRoomFromUrl = (url) => {
    try {
      const u = new URL(url);
      const loc = u.searchParams.get("loc_code");
      if (loc) {
        const parts = loc.split(";");
        return parts[parts.length - 1] || null;
      }
    } catch (_) {
      const m = String(url).match(/loc_code=([^&]+)/i);
      if (m) {
        const parts = m[1].split(";");
        return parts[parts.length - 1] || null;
      }
    }
    return null;
  };
  const titleCaseStreet = (street) => {
    if (!street) return "";
    return street
      .toLowerCase()
      .split(/\s+/)
      .map((w) => {
        const keep = [
          "st",
          "rd",
          "dr",
          "ave",
          "blvd",
          "pde",
          "ct",
          "ln",
          "pl",
          "hwy",
          "sq",
        ];
        if (keep.includes(w)) return w[0].toUpperCase() + w.slice(1);
        if (/^[0-9\-]+$/.test(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  };
  const venueLabel = (v) => {
    if (!v) return "";
    let room = "";
    if (v.room) {
      if (isUrlValue(v.room)) room = extractRoomFromUrl(v.room) || "";
      else room = v.room;
    } else if (v.name) {
      room = v.name;
    }
    const buildingRaw = v.building || "";
    const [street, ...restParts] = buildingRaw.split(",");
    const streetTitled = titleCaseStreet(street?.trim());
    const rest = restParts.join(",").trim();
    const buildingFormatted = [streetTitled, rest].filter(Boolean).join(" ");
    return room ? `Room ${room} — ${buildingFormatted}` : buildingFormatted;
  };
  const venueLink = (v) => (v?.room && isUrlValue(v.room) ? v.room : null);

  const formatDateTime = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleString("en-AU", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} - ${e.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  const onView = (assignmentId) =>
    router.push(`/student/booking/${assignmentId}/confirmation`);

  const onCancelClick = (booking) => {
    // Add all necessary booking data including policies
    const bookingWithPolicies = {
      ...booking,
      bookingDeadline: booking.bookingDeadline || null,
      lockoutEnabled:
        booking.lockoutEnabled !== undefined ? booking.lockoutEnabled : true,
      lockoutWindowHours: booking.lockoutWindowHours || 24,
      entity: booking.entity || { type: "INDIVIDUAL" },
    };
    setSelectedBooking(bookingWithPolicies);
    setCancelDialogOpen(true);
  };

  const onCancelConfirm = async () => {
    if (!selectedBooking) return;

    setIsProcessingCancel(true);
    try {
      // Backend requires sessionId, not bookingId
      const sessionId = selectedBooking.session?.sessionId;
      if (!sessionId) {
        showNotification(
          "error",
          "Cannot cancel booking: Timeslot information missing"
        );
        setIsProcessingCancel(false);
        return;
      }

      const res = await studentBookingService.cancelBooking(
        selectedBooking.assignmentId,
        sessionId,
        studentId
      );
      if (res?.success) {
        showNotification("success", "Booking cancelled successfully");
        await queryClient.invalidateQueries({
          queryKey: ["studentMyBookings", studentId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["studentAssignments", studentId],
        });
        setCancelDialogOpen(false);
        setSelectedBooking(null);
      } else {
        const msg =
          mapErrorCodeToMessage(res?.code) ||
          res?.message ||
          "Failed to cancel";
        showNotification("error", msg);
      }
    } catch (e) {
      const code = e?.response?.data?.code;
      showNotification(
        "error",
        mapErrorCodeToMessage(code) || "Failed to cancel booking"
      );
    } finally {
      setIsProcessingCancel(false);
    }
  };

  const mapErrorCodeToMessage = (code) => {
    switch (code) {
      case "DEADLINE_PASSED":
        return "The booking window is closed.";
      case "LOCKOUT_WINDOW":
        return "Cancellations are disabled within the lockout window.";
      default:
        return null;
    }
  };

  const isCancelDisabled = (b) => {
    const now = new Date();
    const start = new Date(b.session?.start);
    const deadline = b.bookingDeadline ? new Date(b.bookingDeadline) : null;
    if (deadline && now > deadline)
      return { disabled: true, reason: "Booking deadline passed" };
    if (b.lockoutEnabled && typeof b.lockoutWindowHours === "number") {
      const msUntil = start - now;
      const hoursUntil = msUntil / (1000 * 60 * 60);
      if (hoursUntil <= b.lockoutWindowHours)
        return {
          disabled: true,
          reason: `Within ${b.lockoutWindowHours}h lockout`,
        };
    }
    return { disabled: false, reason: null };
  };

  if (isLoading) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-bookmark text-blue-600 dark:text-blue-400 mr-2"></i>
            My Bookings
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Loading bookings...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-bookmark text-blue-600 dark:text-blue-400 mr-2"></i>
            My Bookings
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load bookings
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="dashboard-card mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-bookmark text-blue-600 dark:text-blue-400 mr-2"></i>
            My Bookings
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar text-gray-400 dark:text-gray-500 text-2xl"></i>
          </div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
            No upcoming bookings
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Book your assessment timeslots from the list above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-bookmark text-blue-600 dark:text-blue-400 mr-2"></i>
            My Bookings
          </h2>
          <span className="ml-3 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {bookings.length} upcoming
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {bookings.map((b) => (
          <div
            key={b.bookingId}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-3 md:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {b.assignmentName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {b.courseCode} {b.courseName ? `- ${b.courseName}` : ""}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                  <i className="fas fa-calendar-alt mr-1"></i>{" "}
                  {formatDateTime(b.session.start, b.session.end)}
                </p>
                {b.session.venue && (
                  <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                    {venueLink(b.session.venue) ? (
                      <a
                        href={venueLink(b.session.venue)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View map"
                        className="text-blue-600 hover:underline mr-1"
                      >
                        <i className="fas fa-location-dot" />
                      </a>
                    ) : (
                      <i className="fas fa-map-marker-alt mr-1"></i>
                    )}
                    {venueLabel(b.session.venue)}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  Upcoming
                </span>
                <button
                  onClick={() => onView(b.assignmentId)}
                  className="px-3 py-1.5 text-xs rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  View Details
                </button>
                {(() => {
                  const g = isCancelDisabled(b);
                  return (
                    <button
                      onClick={() => !g.disabled && onCancelClick(b)}
                      disabled={g.disabled}
                      className={`px-3 py-1.5 text-xs rounded-md ${
                        g.disabled
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      Cancel Booking
                    </button>
                  );
                })()}
              </div>
            </div>
            {(() => {
              const g = isCancelDisabled(b);
              return (
                g.disabled && (
                  <div className="text-xs text-gray-500 mt-2">
                    {g.reason}. To change your time, cancel earlier or contact
                    your course admin.
                  </div>
                )
              );
            })()}
          </div>
        ))}
      </div>

      {/* Confirmation Cancel Dialog */}
      <ConfirmCancelDialog
        isOpen={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedBooking(null);
        }}
        onConfirm={onCancelConfirm}
        booking={selectedBooking}
        isProcessing={isProcessingCancel}
      />
    </div>
  );
}
