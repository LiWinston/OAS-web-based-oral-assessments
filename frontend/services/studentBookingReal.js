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
    // Backend defaults pageNum=1; use 1-based and larger page size by default
    const res = await api.get(`/api/assignments/${assignmentId}/sessions`, {
      params: {
        studentId,
        date,
        pageNum: pageNum || 1,
        pageSize: pageSize || 200,
        includeReasons,
      },
    });
    const body = res.data;
    const payload = body?.data;
    // If backend already returns timeSlots shape, pass through
    if (Array.isArray(payload?.timeSlots)) return body;
    // If backend returns flat sessions[], adapt to existing UI shape with synthetic one-to-one slot wrapping
    if (Array.isArray(payload?.sessions)) {
      const timeSlots = payload.sessions.map((s) => ({
        slotId: s.sessionId ?? s.id,
        start: s.start,
        end: s.end,
        venue: s.venue,
        timezone: s.timezone,
        requiredExaminers: s.coverage?.required,
        currentExaminers: s.coverage?.assigned,
        sessions: [
          {
            sessionId: s.sessionId ?? s.id,
            start: s.start,
            end: s.end,
            availability: s.availability || { canBook: true },
          },
        ],
      }));
      return {
        ...body,
        data: {
          assignment: payload.assignment,
          timeSlots,
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

  async getMyBookings(
    studentId,
    { status = "upcoming", pageNum = 0, pageSize = 20 } = {}
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
    return res.data;
  },

  async getGroupContext(studentId, assignmentId) {
    const res = await api.get(
      `/api/students/${studentId}/assignments/${assignmentId}/group`
    );
    return res.data;
  },
};

export default studentBookingServiceReal;
