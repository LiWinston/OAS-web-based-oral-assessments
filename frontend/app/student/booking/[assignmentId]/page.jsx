"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuth from "@/hooks/useAuth";
import { useNotification } from "@/hooks/useNotification";
import { studentBookingServiceReal as studentBookingService } from "@/services/studentBookingReal";
import { Button } from "@/components/ui/button";

export default function StudentBookingSteps() {
  const { assignmentId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const studentId = user?.id || user?.userId || user?.studentId;

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [venueFilter, setVenueFilter] = useState("ALL");

  // Availability summary
  const { data: availabilityData, isLoading: loadingAvailability } = useQuery({
    queryKey: ["assignmentAvailability", assignmentId, studentId],
    queryFn: () =>
      studentBookingService.getAssignmentAvailability(assignmentId, studentId),
    enabled: isAuthenticated && Boolean(studentId) && Boolean(assignmentId),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const secs = query?.state?.data?.data?.pollingHintSeconds || 30;
      return secs * 1000;
    },
  });

  const availability = availabilityData?.data;
  const isGroupType =
    availability?.assessmentType === "GROUP" || availability?.assessmentType === "MIXED";
  const {
    data: currentBookingRes,
    isLoading: loadingCurrentBooking,
    error: currentBookingError,
  } = useQuery({
    queryKey: ["currentBookingGuard", assignmentId, studentId],
    queryFn: () => studentBookingService.getCurrentBooking(assignmentId, studentId),
    enabled: isAuthenticated && Boolean(studentId) && Boolean(assignmentId),
    staleTime: 30 * 1000,
    retry: 1,
  });
  const currentBookingPayload = currentBookingRes?.data || null;
  const activeBookingEntity =
    currentBookingPayload?.booking || currentBookingPayload || null;
  const hasActiveBooking = Boolean(
    currentBookingPayload?.hasActiveBooking ||
      activeBookingEntity?.hasActiveBooking ||
      activeBookingEntity?.bookingId
  );
  const [groupContextEnabled, setGroupContextEnabled] = useState(true);
  const daysWithAvailability =
    availability?.summary?.daysWithAvailability || [];
  // Adjust calendar to show first available date
  const earliestAvailable = useMemo(() => {
    if (!daysWithAvailability?.length) return null;
    const sorted = [...daysWithAvailability].sort();
    return sorted[0];
  }, [daysWithAvailability]);
  // Move calendar to earliest available month
  useEffect(() => {
    if (earliestAvailable) {
      const d = new Date(earliestAvailable);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [earliestAvailable]);

  // Build quick date list from availability days or fallback next 10 days
  const candidateDates = useMemo(() => {
    if (daysWithAvailability?.length) return daysWithAvailability;
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + i
      );
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      arr.push(key);
    }
    return arr;
  }, [daysWithAvailability]);

  const availSet = useMemo(() => new Set(candidateDates), [candidateDates]);
  const canProceedStep1 = Boolean(selectedDate && availSet.has(selectedDate));
  const canProceedStep2 = Boolean(selectedSession);

  // Sessions for selected date
  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ["bookableSessions", assignmentId, studentId, selectedDate],
    queryFn: () =>
      studentBookingService.getBookableSessions(assignmentId, studentId, {
        date: selectedDate,
        includeReasons: true,
      }),
    enabled:
      isAuthenticated &&
      Boolean(studentId) &&
      Boolean(assignmentId) &&
      Boolean(selectedDate),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: availability?.pollingHintSeconds
      ? availability.pollingHintSeconds * 1000
      : 30 * 1000,
  });

  const timeSlots = sessionsData?.data?.timeSlots || [];
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
        const keep = ["st", "rd", "dr", "ave", "blvd", "pde", "ct", "ln", "pl", "hwy", "sq"];
        if (keep.includes(w)) return w[0].toUpperCase() + w.slice(1);
        // preserve numbers/hyphens
        if (/^[0-9\-]+$/.test(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  };
  const getRoomCode = (v) => {
    if (!v) return "";
    if (v.room) {
      if (isUrlValue(v.room)) {
        const code = extractRoomFromUrl(v.room);
        if (code) return code;
      } else {
        return v.room;
      }
    }
    return v.name || "";
  };
  const venueLabel = (v) => {
    if (!v) return "";
    const room = getRoomCode(v);
    const buildingRaw = v.building || "";
    const [street, ...restParts] = buildingRaw.split(",");
    const streetTitled = titleCaseStreet(street?.trim());
    const rest = restParts.join(",").trim();
    const buildingFormatted = [streetTitled, rest].filter(Boolean).join(" ");
    return room ? `Room ${room} — ${buildingFormatted}` : buildingFormatted;
  };
  const venueLink = (v) => (v?.room && isUrlValue(v.room) ? v.room : null);
  const venueOptions = useMemo(() => {
    const labels = Array.from(
      new Set(timeSlots.map((s) => venueLabel(s.venue)).filter(Boolean))
    );
    return ["ALL", ...labels];
  }, [timeSlots]);
  const listSessions = useMemo(() => {
    if (venueFilter === "ALL") return timeSlots;
    return timeSlots.filter((slot) => venueLabel(slot.venue) === venueFilter);
  }, [timeSlots, venueFilter]);

  const sessionIsBookable = (s) => {
    const avail = s?.availability || {};
    if (typeof avail.canBook === "boolean") return avail.canBook;
    if (typeof avail.reason === "string" && avail.reason) return false;
    // If backend omits availability, by contract it returns only bookable sessions (student flow)
    return true;
  };

  const bookMutation = useMutation({
    mutationFn: ({ payload, idempotencyKey }) =>
      studentBookingService.createBooking(assignmentId, payload, idempotencyKey),
    onSuccess: async (res) => {
      if (res?.success) {
        showNotification("success", "Booking confirmed");
        // Invalidate student booking caches
        await queryClient.invalidateQueries({
          queryKey: ["studentMyBookings", studentId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["studentAssignments", studentId],
        });
        router.push(`/student/booking/${assignmentId}/confirmation`);
      } else {
        showNotification("error", mapErrorCodeToMessage(res?.code) || res?.message || "Failed to book");
      }
    },
    onError: (err) => {
      const code = err?.response?.data?.code;
      showNotification("error", mapErrorCodeToMessage(code) || "Failed to book the session");
    },
  });

  const displayAssignmentName =
    sessionsData?.data?.assignment?.assignmentName || `Assignment ${assignmentId}`;

  // Group context (only for GROUP/MIXED)
  const { data: groupData } = useQuery({
    queryKey: ["groupContext", assignmentId, studentId],
    queryFn: () => studentBookingService.getGroupContext(studentId, assignmentId),
    enabled:
      groupContextEnabled &&
      isGroupType &&
      isAuthenticated &&
      Boolean(studentId) &&
      Boolean(assignmentId),
    staleTime: 60 * 1000,
    retry: 1, // Only retry once if it fails
  });
  const groupContext = groupData?.data || null;

  const mapErrorCodeToMessage = (code) => {
    switch (code) {
      case "SESSION_TAKEN":
        return "This session was just booked by someone else.";
      case "ALREADY_BOOKED":
        return "You already have an active booking for this assessment.";
      case "SLOT_UNSTAFFED":
      case "SESSION_CLOSED":
        return "This session is not available.";
      case "LOCKOUT_WINDOW":
        return "Bookings are closed within the final hours before the session.";
      case "DEADLINE_PASSED":
        return "The booking window is closed.";
      case "FORBIDDEN":
        return "You’re not eligible to book this assessment.";
      case "NOT_FOUND":
        return "This session is no longer available.";
      default:
        return null;
    }
  };

  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const onPickDate = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSession(null);
  };

  const onPickSession = (slot, s) => {
    if (!sessionIsBookable(s)) return;
    // Track slotId alongside sessionId to avoid cross-venue selection bleed
    setSelectedSession({ ...s, slotId: slot.slotId, venue: slot.venue, timezone: slot.timezone });
  };

  const onConfirm = () => {
    if (hasActiveBooking) {
      showNotification("error", "Already booked. Please reschedule via My Bookings.");
      router.push(`/student/booking/${assignmentId}/confirmation`);
      return;
    }
    if (!selectedSession) return;
    const idempotencyKey = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // For GROUP assignments, try to include groupId if available
    // If group context is unavailable, backend might handle it differently
    const payload = {
      studentId,
      sessionId: selectedSession.sessionId,
      ...(isGroupType && groupContext?.groupId ? { groupId: groupContext.groupId } : {}),
    };
    bookMutation.mutate({ payload, idempotencyKey });
  };

  if (loadingCurrentBooking && isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Checking current booking status…
        </div>
      </div>
    );
  }

  if (!loadingCurrentBooking && hasActiveBooking && !currentBookingError) {
    const session = activeBookingEntity?.session;
    const viewConfirmation = () =>
      router.push(`/student/booking/${assignmentId}/confirmation`);
    const viewBoard = () => router.push(`/student/booking`);

    return (
      <div className="space-y-6">
        <div className="dashboard-card p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300">
              <i className="fas fa-info-circle text-3xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Already booked. Please reschedule via My Bookings.
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            You already have an active booking for this assessment. To review or reschedule your booking, head to My Bookings.
          </p>
          {session ? (
            <div className="mt-6 inline-block text-left bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-5 py-4">
              <div className="text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wide mb-1">
                Current session
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                {new Date(session.start).toLocaleDateString("en-AU", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {" · "}
                {new Date(session.start).toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
                {" - "}
                {new Date(session.end).toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
              {session?.venue && (
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {session.venue.name || session.venue.room || ""}
                </div>
              )}
            </div>
          ) : null}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={viewConfirmation} className="w-full sm:w-auto">
              View booking
            </Button>
            <Button variant="outline" onClick={viewBoard} className="w-full sm:w-auto">
              Go to My Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="mb-2">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <a
                href="/student/booking"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                My Bookings
              </a>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Book Assessment
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Book Assessment Session
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {displayAssignmentName}
          </p>
        </div>
      </div>

      {/* Group banner */}
      {isGroupType && (
        <div className="dashboard-card p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          {groupContext ? (
            <>
              <div className="text-sm text-blue-900 dark:text-blue-100">
                You are booking on behalf of <span className="font-semibold">{groupContext.groupName || `Group ${groupContext.groupId}`}</span>.
              </div>
              {groupContext.members?.length ? (
                <div className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  Members: {groupContext.members.map(m => m.name || m.email || m.studentId).join(', ')}
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <i className="fas fa-users mr-2"></i>
              This is a group assessment. You are booking for your group.
            </div>
          )}
        </div>
      )}

      {/* Step Indicator */}
      <div className="dashboard-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step >= 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`ml-2 text-sm ${
                step >= 1
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Select Date
            </div>
          </div>
          <div
            className={`h-0.5 flex-1 mx-2 ${
              step > 1 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
            }`}
          ></div>
          <div className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
            <div
              className={`ml-2 text-sm ${
                step >= 2
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Choose Session
            </div>
          </div>
          <div
            className={`h-0.5 flex-1 mx-2 ${
              step > 2 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
            }`}
          ></div>
          <div className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step >= 3
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
            <div
              className={`ml-2 text-sm ${
                step >= 3
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Confirm
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Select Date - Calendar view */}
      {step === 1 && (
        <div className="dashboard-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Select a Date
            </h2>
            <div className="flex items-center">
              <button
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
                onClick={() =>
                  setCurrentMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
                aria-label="Previous month"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="text-sm text-gray-700 dark:text-gray-300 min-w-[160px] text-center">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <button
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
                onClick={() =>
                  setCurrentMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
                aria-label="Next month"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          {loadingAvailability ? (
            <div className="text-sm text-gray-500">Loading availability…</div>
          ) : (
            <div>
              <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center font-medium">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const year = currentMonth.getFullYear();
                  const month = currentMonth.getMonth();
                  const first = new Date(year, month, 1);
                  const startIdx = first.getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells = [];
                  const availSet = new Set(candidateDates);
                  for (let i = 0; i < startIdx; i++)
                    cells.push(<div key={`padl-${i}`} />);
                  const toKey = (y, m, d) =>
                    `${y}-${String(m + 1).padStart(2, "0")}-${String(
                      d
                    ).padStart(2, "0")}`;
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = toKey(year, month, day);
                    const isAvail = availSet.has(dateStr);
                    const isSelected = selectedDate === dateStr;
                    cells.push(
                      <button
                        key={dateStr}
                        disabled={!isAvail}
                        onClick={() => onPickDate(dateStr)}
                        className={`min-h-16 p-2 rounded-md border text-left ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        } ${
                          !isAvail
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {day}
                        </div>
                        {isAvail && (
                          <div className="mt-2 text-[10px] px-1 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 inline-block">
                            Available
                          </div>
                        )}
                      </button>
                    );
                  }
                  // trailing pads to complete 6 rows
                  const total = startIdx + daysInMonth;
                  const pads = 7 * 6 - total;
                  for (let i = 0; i < pads; i++)
                    cells.push(<div key={`padr-${i}`} />);
                  return cells;
                })()}
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 mt-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mr-1"></div>
                  <span>Full</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 mr-1"></div>
                  <span>Past/Unavailable</span>
                </div>
              </div>
              {selectedDate && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Selected Date:{" "}
                    {new Date(selectedDate).toLocaleDateString("en-AU", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next: Choose Session
                  </button>
                </div>
              )}
              {!selectedDate && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className={`px-4 py-2 text-sm rounded-md ${
                      canProceedStep1
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Next: Choose Session
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Sessions */}
      {step === 2 && (
        <div className="dashboard-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Choose a Session
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(selectedDate).toLocaleDateString("en-AU", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          {listSessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Venue
                </label>
                <select
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:text-gray-200"
                >
                  {venueOptions.map((v) => (
                    <option key={v} value={v}>
                      {v === "ALL" ? "All Venues" : v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {loadingSessions ? (
            <div className="text-sm text-gray-500">Loading sessions…</div>
          ) : listSessions.length === 0 ? (
            <div className="text-sm text-gray-500">
              No sessions available for this date.
            </div>
          ) : (
            <div className="space-y-4">
              {listSessions.map((slot) => (
                <div
                  key={slot.slotId}
                  className="border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {venueLink(slot.venue) ? (
                        <a href={venueLink(slot.venue)} target="_blank" rel="noopener noreferrer" title="View map" className="text-blue-600 hover:underline mr-1">
                          <i className="fas fa-location-dot" />
                        </a>
                      ) : (
                        <i className="fas fa-location-dot mr-1" />
                      )}
                      {venueLabel(slot.venue)}
                      <span className="ml-2 text-xs text-gray-500">
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </span>
                      {typeof slot.requiredExaminers === 'number' && typeof slot.currentExaminers === 'number' && (
                        <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                          {slot.currentExaminers}/{slot.requiredExaminers} examiners
                        </span>
                      )}
                      {Array.isArray(slot.sessions) && (
                        <span className="ml-2 text-[11px] text-gray-500">
                          {slot.sessions.filter(s => sessionIsBookable(s)).length} of {slot.sessions.length} sessions available
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slot.sessions.map((s) => (
                      <button
                        key={`${slot.slotId}-${s.sessionId}`}
                        disabled={!sessionIsBookable(s)}
                        onClick={() => onPickSession(slot, s)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          selectedSession?.slotId === slot.slotId &&
                          selectedSession?.sessionId === s.sessionId
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        } ${
                          !sessionIsBookable(s)
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {formatTime(s.start)} - {formatTime(s.end)}
                            </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {venueLink(slot.venue) ? (
                              <a href={venueLink(slot.venue)} target="_blank" rel="noopener noreferrer" title="View map" className="text-blue-600 hover:underline mr-1">
                                <i className="fas fa-location-dot" />
                              </a>
                            ) : (
                              <i className="fas fa-location-dot mr-1"></i>
                            )}
                            {venueLabel(slot.venue)}
                            {slot.timezone ? (
                              <span className="ml-2 text-[10px] px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {slot.timezone}
                              </span>
                            ) : null}
                          </div>
                        </div>
                          {!sessionIsBookable(s) && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {s.availability?.reason || "Unavailable"}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className={`px-4 py-2 text-sm rounded-md ${
                canProceedStep2
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next: Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && selectedSession && (
        <div className="dashboard-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Confirm Your Booking
            </h2>
            <button
              onClick={() => setStep(2)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <i className="fas fa-arrow-left mr-1" />
              Back
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-gray-500">Date</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {new Date(selectedDate).toLocaleDateString("en-AU", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Time</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {formatTime(selectedSession.start)} -{" "}
                  {formatTime(selectedSession.end)}
                  {selectedSession?.timezone ? (
                    <span className="ml-2 text-xs px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {selectedSession.timezone}
                    </span>
                  ) : null}
                </div>
              </div>
              {selectedSession?.venue && (
                <div>
                  <div className="text-gray-500">Venue</div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">{venueLabel(selectedSession.venue)}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Duration</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {Math.round(
                    (new Date(selectedSession.end) -
                      new Date(selectedSession.start)) /
                      (60 * 1000)
                  )}{" "}
                  minutes
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => router.push("/student/booking")}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={bookMutation.isLoading}
              className="px-4 py-2 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white"
            >
              {bookMutation.isLoading ? "Booking…" : "Confirm & Book"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
