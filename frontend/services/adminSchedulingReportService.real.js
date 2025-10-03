import apiClient from "@/services/apiClient.js";
import { courseAdminSessionService } from "@/services/courseAdminSessionService.js";

const withStaffingStatus = (session) => {
  const assigned = session?.assignedExaminers?.length || 0;
  const required = session?.requiredExaminers || 0;
  const staffingStatus = assigned === 0
    ? "none"
    : assigned < required
      ? "partial"
      : "fully";

  return {
    ...session,
    staffingStatus,
  };
};

const normaliseSessionsResponse = (payload = []) => {
  if (!Array.isArray(payload)) return [];
  return payload.map((session) => ({
    ...withStaffingStatus(session),
    startTime: typeof session.startTime === "string"
      ? session.startTime.slice(0, 5)
      : session.startTime,
    endTime: typeof session.endTime === "string"
      ? session.endTime.slice(0, 5)
      : session.endTime,
  }));
};

const deriveVenues = (sessions = []) => {
  const map = new Map();
  sessions.forEach((session) => {
    const id = session.venueId ?? session.venue?.id;
    if (!id) return;
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: session.venueName || session.venue?.name || `Venue ${id}`,
      });
    }
  });
  return Array.from(map.values());
};

const adminSchedulingReportServiceReal = {
  async getCalendar(assignmentId, month) {
    const result = await courseAdminSessionService.getSessionsCalendar(assignmentId, month);
    return { success: true, data: result?.data || {} };
  },

  async getSessions(assignmentId, params = {}) {
    const response = await courseAdminSessionService.getSessions(assignmentId, params);
    const sessions = normaliseSessionsResponse(response?.data);
    const summary = response?.summary || null;
    const venues = deriveVenues(sessions);
    const outsideAssignmentRange = Boolean(response?.outsideAssignmentRange);

    return {
      success: true,
      data: {
        sessions,
        summary,
        venues,
        outsideAssignmentRange,
      },
    };
  },

  async getPublishStatus(assignmentId) {
    const response = await courseAdminSessionService.getAssignmentPublishStatus(assignmentId);
    return { success: true, data: response?.data || { examiners: false, students: false } };
  },

  async getAssignmentMeta(assignmentId) {
    const resp = await apiClient.get(`/api/assignments/${assignmentId}`);
    const payload = resp?.data?.data || resp?.data || null;
    if (!payload) {
      return { success: false, data: null };
    }

    return {
      success: true,
      data: {
        id: payload.id ?? assignmentId,
        name: payload.name ?? payload.assignmentName ?? "",
        courseName: payload.courseName ?? payload.course?.name ?? payload.course?.courseName,
        courseCode: payload.courseCode ?? payload.course?.code ?? payload.course?.courseCode,
        windowStart: payload.startDate ?? payload.windowStart,
        windowEnd: payload.endDate ?? payload.windowEnd,
        timezone: payload.timezone ?? "Australia/Melbourne",
      },
    };
  },
};

export default adminSchedulingReportServiceReal;

