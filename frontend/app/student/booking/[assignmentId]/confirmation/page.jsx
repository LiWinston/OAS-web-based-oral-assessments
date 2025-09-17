"use client";
import { useParams, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { studentBookingServiceReal as studentBookingService } from "@/services/studentBookingReal";

export default function BookingConfirmation() {
  const { assignmentId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const studentId = user?.id || user?.userId || user?.studentId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["currentBooking", assignmentId, studentId],
    queryFn: () =>
      studentBookingService.getCurrentBooking(assignmentId, studentId),
    enabled: isAuthenticated && Boolean(studentId) && Boolean(assignmentId),
  });

  const payload = data?.data || null;
  const hasActive =
    payload?.hasActiveBooking ||
    Boolean(payload?.booking) ||
    Boolean(payload?.bookingId);
  const booking = payload?.booking || payload || null; // Support wrapper or plain booking

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
  const venueLabel = (v) => {
    if (!v) return "";
    let room = "";
    if (v.room) {
      if (isUrlValue(v.room)) room = extractRoomFromUrl(v.room) || ""; else room = v.room;
    } else if (v.name) {
      room = v.name;
    }
    const buildingRaw = v.building || "";
    const [street, ...restParts] = buildingRaw.split(",");
    const streetTitled = (street || "").toLowerCase().split(/\s+/).map(w => {
      const keep = ["st","rd","dr","ave","blvd","pde","ct","ln","pl","hwy","sq"]; if (keep.includes(w)) return w[0].toUpperCase()+w.slice(1);
      if (/^[0-9\-]+$/.test(w)) return w; return w.charAt(0).toUpperCase()+w.slice(1);
    }).join(" ");
    const rest = restParts.join(",").trim();
    const buildingFormatted = [streetTitled, rest].filter(Boolean).join(" ");
    return room ? `Room ${room} — ${buildingFormatted}` : buildingFormatted;
  };
  const venueLink = (v) => (v?.room && isUrlValue(v.room) ? v.room : null);

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mb-4">
          <i className="fas fa-check-circle text-5xl"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Booking Confirmed!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Your assessment session has been successfully booked
        </p>
      </div>

      <div className="dashboard-card p-6">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading booking details…</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load booking</div>
        ) : !hasActive ? (
          <div className="text-sm text-gray-500">
            No active booking found for this assignment.
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Booking Details
              </h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="mr-2">Reference:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  BK-{booking.bookingId}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 gap-6">
                {/* Assessment information (optional in API 5; shown if present) */}
                {(booking.assignmentName || booking.courseCode) && (
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                      Assessment Information
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {booking.assignmentName && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Assessment
                            </h4>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {booking.assignmentName}
                            </p>
                          </div>
                        )}
                        {booking.courseCode && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Course
                            </h4>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {booking.courseCode}
                              {booking.courseName
                                ? ` - ${booking.courseName}`
                                : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Session details (always present) */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                    Appointment Details
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Date & Time
                        </h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {new Date(booking.session.start).toLocaleDateString(
                            "en-AU",
                            { month: "long", day: "numeric", year: "numeric" }
                          )}{" "}
                          |{" "}
                          {new Date(booking.session.start).toLocaleTimeString(
                            "en-AU",
                            { hour: "numeric", minute: "2-digit", hour12: true }
                          )}{" "}
                          -{" "}
                          {new Date(booking.session.end).toLocaleTimeString(
                            "en-AU",
                            { hour: "numeric", minute: "2-digit", hour12: true }
                          )}
                        </p>
                      </div>
                      {booking.session.venue && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Location
                          </h4>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {venueLink(booking.session.venue) ? (
                              <a href={venueLink(booking.session.venue)} target="_blank" rel="noopener noreferrer" title="View map" className="text-blue-600 hover:underline mr-1">
                                <i className="fas fa-location-dot" />
                              </a>
                            ) : null}
                            {venueLabel(booking.session.venue)}
                          </p>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Booking Type
                        </h4>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {booking.entity?.type === "GROUP"
                            ? "Group"
                            : "Individual"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Policies (from API 5 flags if present) */}
                {(booking.reschedulingEnabled !== undefined ||
                  booking.bookingDeadline ||
                  booking.lockoutEnabled) && (
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                      Policies
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                      {booking.reschedulingEnabled !== undefined && (
                        <div className="mb-1">
                          Rescheduling:{" "}
                          {booking.reschedulingEnabled
                            ? "Allowed"
                            : "Not allowed"}
                        </div>
                      )}
                      {booking.bookingDeadline && (
                        <div className="mb-1">
                          Booking deadline:{" "}
                          {new Date(booking.bookingDeadline).toLocaleString(
                            "en-AU",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      )}
                      {booking.lockoutEnabled &&
                        booking.lockoutWindowHours !== undefined && (
                          <div>
                            Lockout window: {booking.lockoutWindowHours} hours
                            before session
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                <i className="fas fa-print mr-1" /> Print Confirmation
              </button>
              <button
                onClick={() => router.push("/student/booking")}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                <i className="fas fa-arrow-left mr-1" /> Return to My Bookings
              </button>
              {/* Reschedule disabled/not available at this stage */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
