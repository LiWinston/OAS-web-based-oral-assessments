/**
 * Student Booking Service (Real)
 *
 * Calls the Spring Boot backend endpoints per API contracts.
 * Note: Endpoints and payloads follow Docs/API/Student-Booking-and-Sessions-API-Contracts(Final).md
 */
import { api } from "./apiClient";

export const studentBookingServiceReal = {
  async getStudentAssignments(
    studentId,
    { status = "all", pageNum = 0, pageSize = 20, sort = "date_asc" } = {}
  ) {
    const res = await api.get(`/api/students/${studentId}/assignments`, {
      params: { status, pageNum, pageSize, sort },
    });
    return res.data;
  },

  async getAssignmentAvailability(assignmentId, studentId) {
    // Backend swagger may not expose a dedicated availability endpoint.
    // Fallback: fetch assignments and extract availability for the given assignment.
    try {
      const res = await api.get(
        `/api/assignments/${assignmentId}/availability`,
        { params: { studentId } }
      );
      return res.data;
    } catch (e) {
      try {
        const list = await this.getStudentAssignments(studentId, {
          status: "all",
          pageNum: 0,
          pageSize: 100,
          sort: "date_asc",
        });
        const items = list?.data?.data || [];
        const found = items.find(
          (a) => String(a.assignmentId) === String(assignmentId)
        );
        if (!found) return { success: false, code: "NOT_FOUND", data: null };
        const availability = found.availability || {};
        return {
          success: true,
          code: "OK",
          data: {
            assignmentId: found.assignmentId,
            assessmentType: found.assessmentType,
            released: availability.released,
            // Backend doesn’t provide explicit visibility rule; default as per PRD
            visibilityRule: "ONLY_FULLY_STAFFED",
            reschedulingEnabled: availability.reschedulingEnabled,
            bookingDeadline: availability.bookingDeadline,
            lockoutEnabled: availability.lockoutEnabled,
            lockoutWindowHours: availability.lockoutWindowHours,
            summary: {
              totalSlots: undefined,
              totalSessions: undefined,
              availableSessions: availability.availableSessions,
              daysWithAvailability: undefined,
            },
            pollingHintSeconds: availability.pollingHintSeconds ?? 30,
          },
        };
      } catch (ignored) {
        throw e;
      }
    }
  },

  async getBookableSessions(
    assignmentId,
    studentId,
    { date, pageNum = 0, pageSize = 50, includeReasons = true } = {}
  ) {
    // Date is required by the backend API
    if (!date) {
      throw new Error("Date parameter is required for fetching bookable timeslots");
    }

    // Backend defaults pageNum=1; use 1-based and larger page size by default
    const res = await api.get(`/api/assignments/${assignmentId}/sessions`, {
      params: {
        studentId,
        date,
        pageNum: pageNum ? pageNum : 1,
        pageSize: pageSize || 200,
        includeReasons,
      },
    });
    const body = res.data;
    const payload = body?.data;

    // Helper function to normalize datetime format
    const normalizeDateTime = (dt) => {
      if (!dt) return dt;
      // If datetime is missing seconds/timezone, add them
      if (dt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        return dt + ":00+10:00"; // Add seconds and Melbourne timezone
      }
      if (dt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
        return dt + "+10:00"; // Add Melbourne timezone
      }
      return dt;
    };

    // If backend already returns timeSlots shape, pass through
    if (Array.isArray(payload?.timeSlots)) return body;
    const mapVenue = (venue) => {
      if (!venue) return undefined;
      if (venue.name || venue.room || venue.building) return venue;
      return {
        id: venue.id ?? venue.venueId,
        name: venue.venueName || venue.name,
        assignmentId: venue.assignmentId,
      };
    };

    // If backend returns flat sessions[], adapt to existing UI shape with synthetic one-to-one slot wrapping
    if (Array.isArray(payload?.sessions)) {
      const timeSlots = payload.sessions.map((s) => {
        const venue = mapVenue(s.venue) ||
          (s.venueId || s.venueName
            ? { id: s.venueId, name: s.venueName }
            : undefined);
        return {
          slotId: s.sessionId ?? s.id,
          start: normalizeDateTime(s.start),
          end: normalizeDateTime(s.end),
          venue,
          timezone: s.timezone || "Australia/Melbourne",
          requiredExaminers: s.coverage?.required,
          currentExaminers: s.coverage?.assigned,
          sessions: [
            {
              sessionId: s.sessionId ?? s.id,
              start: normalizeDateTime(s.start),
              end: normalizeDateTime(s.end),
              status: s.status,
              availability: s.availability || { canBook: true },
            },
          ],
        };
      }).sort((a, b) => {
        if (!a.start || !b.start) return 0;
        return new Date(a.start) - new Date(b.start);
      });
      return {
        ...body,
        data: {
          assignment: payload.assignment,
          calendar: payload.calendar,
          timeSlots,
          sessions: payload.sessions,
          pollingHintSeconds: payload.pollingHintSeconds,
        },
      };
    }
    return body;
  },

  async createBooking(
    assignmentId,
    { studentId, sessionId, groupId },
    idempotencyKey
  ) {
    // Default OFF to avoid CORS preflight failures until backend whitelists header
    const useIdempotency =
      idempotencyKey && process.env.NEXT_PUBLIC_ENABLE_IDEMPOTENCY === "true";
    const config = useIdempotency
      ? { headers: { "Idempotency-Key": idempotencyKey } }
      : undefined;
    try {
      const res = await api.post(
        `/api/assignments/${assignmentId}/bookings`,
        { studentId, sessionId, groupId },
        config
      );
      return res.data;
    } catch (err) {
      // Fallback: if network error (likely CORS preflight blocked due to custom header), retry without Idempotency-Key
      if (useIdempotency && !err.response && err.request) {
        try {
          const res2 = await api.post(
            `/api/assignments/${assignmentId}/bookings`,
            { studentId, sessionId, groupId }
          );
          return res2.data;
        } catch (err2) {
          throw err2;
        }
      }
      throw err;
    }
  },

  async rescheduleBooking(assignmentId, currentSessionId, studentId, targetSessionId) {
    const res = await api.post(
      `/api/assignments/${assignmentId}/bookings/${currentSessionId}/reschedule`,
      { studentId, targetSessionId }
    );
    return res.data;
  },

  async getMyBookings(
    studentId,
    { pageNum = 0, pageSize = 20 } = {}
  ) {
    // Aggregate from assignments + current booking; fallback if backend 'booked' filter is not up-to-date
    const fetchAssignments = async (flt) => {
      const res = await this.getStudentAssignments(studentId, {
        status: flt,
        pageNum: 0,
        pageSize: 200,
        sort: "date_asc",
      });
      return res?.data?.data || [];
    };
    let items = await fetchAssignments("booked");
    if (!items?.length) {
      // Fallback: fetch all and filter locally on booking.hasActiveBooking
      const all = await fetchAssignments("all");
      items = (all || []).filter((a) => a?.booking?.hasActiveBooking === true);
    }
    // Fetch current booking detail for each assignment
    const results = await Promise.all(
      items.map(async (a) => {
        try {
          const cur = await this.getCurrentBooking(a.assignmentId, studentId);
          const payload = cur?.data;
          const booking =
            payload?.booking || (payload?.hasActiveBooking ? payload : null);
          if (!booking) return null;
          return {
            bookingId: booking.bookingId,
            assignmentId: a.assignmentId,
            assignmentName: a.assignmentName,
            courseCode: a.courseCode,
            courseName: a.courseName,
            entity: booking.entity,
            session: booking.session,
            reschedulingEnabled:
              booking.reschedulingEnabled ??
              a.availability?.reschedulingEnabled,
            bookingDeadline:
              booking.bookingDeadline ?? a.availability?.bookingDeadline,
            lockoutEnabled:
              booking.lockoutEnabled ?? a.availability?.lockoutEnabled,
            lockoutWindowHours:
              booking.lockoutWindowHours ?? a.availability?.lockoutWindowHours,
          };
        } catch {
          return null;
        }
      })
    );
    const data = results.filter(Boolean);
    return {
      success: true,
      code: "OK",
      data: { pageNum, pageSize, total: data.length, data },
    };
  },

  async cancelBooking(assignmentId, sessionId, studentId) {
    // Backend cancel path uses sessionId, not bookingId
    const res = await api.delete(
      `/api/assignments/${assignmentId}/bookings/${sessionId}`,
      { params: { studentId } }
    );
    return res.data;
  },

  async getBookingsInRange(studentId, { from, to }) {
    // API contract does not define from/to range filter; fetch upcoming and filter client-side
    const res = await api.get(`/api/students/${studentId}/bookings`, {
      params: { status: "upcoming", pageNum: 0, pageSize: 200 },
    });
    const payload = res.data;
    try {
      const list = payload?.data?.data || [];
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      const filtered = list.filter((b) => {
        const start = new Date(b.session?.start);
        if (fromDate && start < fromDate) return false;
        if (toDate && start > toDate) return false;
        return true;
      });
      return { success: true, code: "OK", data: filtered };
    } catch (e) {
      return payload;
    }
  },

  async getCurrentBooking(assignmentId, studentId) {
    const res = await api.get(
      `/api/students/${studentId}/assignments/${assignmentId}/booking`
    );

    // Normalize the response to handle inconsistent venue structure
    const data = res.data;
    if (data?.data?.booking?.session) {
      const session = data.data.booking.session;
      const venue = session.venue;

      // Normalize venue structure
      if (venue) {
        const normalizedVenue = {
          venueId: venue.id || venue.venueId,
          name: venue.venueName || venue.name || '',
          building: venue.building,
          room: venue.room
        };
        session.venue = normalizedVenue;
      }

      // Normalize datetime format
      if (session.start && session.start.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        session.start = session.start + ":00+10:00";
      }
      if (session.end && session.end.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        session.end = session.end + ":00+10:00";
      }

      // Ensure timezone is set
      if (!session.timezone) {
        session.timezone = "Australia/Melbourne";
      }
    }

    return data;
  },

  async getGroupContext(studentId, assignmentId) {
    try {
      const res = await api.get(
        `/api/students/${studentId}/assignments/${assignmentId}/group`
      );
      return res.data;
    } catch (error) {
      // If the API fails (500 error), return null data instead of throwing
      // This allows the booking to continue even if group context is unavailable
      console.warn("Group context API failed:", error);

      return {
        success: false,
        code: "GROUP_CONTEXT_UNAVAILABLE",
        data: null
      };
    }
  },
};

export default studentBookingServiceReal;
