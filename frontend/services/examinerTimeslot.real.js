import apiClient from '@/services/apiClient.js';

// Helper to build ISO datetime strings from date + LocalTime
function toIsoFromDateAndLocalTime(dateStr, timeVal) {
  if (!dateStr || !timeVal) return null;
  // Accept both LocalTime object {hour, minute} and string "HH:mm[:ss]"
  if (typeof timeVal === 'string') {
    const parts = timeVal.split(':');
    const h = String(parts[0] ?? 0).padStart(2, '0');
    const m = String(parts[1] ?? 0).padStart(2, '0');
    const local = new Date(`${dateStr}T${h}:${m}:00`);
    return local.toISOString();
  }
  const h = String(timeVal.hour ?? 0).padStart(2, '0');
  const m = String(timeVal.minute ?? 0).padStart(2, '0');
  const local = new Date(`${dateStr}T${h}:${m}:00`);
  return local.toISOString();
}

function normalizeSession(session) {
  if (!session) return null;

  const sessionId = session.sessionId ?? session.id ?? session.slotId;
  const start = session.start ?? toIsoFromDateAndLocalTime(session.date, session.startTime);
  const end = session.end ?? toIsoFromDateAndLocalTime(session.date, session.endTime);
  const venue = session.venue
    || (session.venueId || session.venueName
      ? { venueId: session.venueId, name: session.venueName }
      : null);

  const required = session.requiredExaminers ?? session.coverage?.required ?? session.required ?? null;
  const assigned = session.currentExaminers
    ?? session.coverage?.assigned
    ?? (Array.isArray(session.assignedExaminers) ? session.assignedExaminers.length : null);
  const isFullyStaffed = session.coverage?.isFullyStaffed
    ?? (required != null && assigned != null ? assigned >= required : false);

  const conflict = session.conflict ?? false;
  const alreadyAssigned = session.assigned ?? false;
  const rawAvailability = session.availability || {};
  const availability = {
    canSelect: rawAvailability.canSelect ?? (!isFullyStaffed && !conflict && !alreadyAssigned),
    reason: rawAvailability.reason
      ?? (isFullyStaffed
        ? 'SESSION_CLOSED'
        : conflict
          ? 'TIME_CONFLICT'
          : alreadyAssigned
            ? 'ALREADY_ASSIGNED'
            : null),
  };

  const bookingCount = session.bookingCount
    ?? session.bookedCount
    ?? session.studentCapacity?.bookedCount
    ?? 0;
  const capacity = session.capacity
    ?? session.studentCapacity?.capacity
    ?? session.studentCapacity?.total
    ?? null;

  return {
    sessionId,
    slotId: sessionId,
    start,
    end,
    timezone: session.timezone || 'Australia/Melbourne',
    venue,
    requiredExaminers: required,
    currentExaminers: assigned,
    coverage: session.coverage || {
      required,
      assigned,
      isFullyStaffed,
    },
    availability,
    isFull: session.isFull ?? session.full ?? isFullyStaffed,
    isBooked: session.isBooked ?? bookingCount > 0,
    bookingCount,
    capacity,
    canWithdraw: session.canWithdraw ?? (bookingCount === 0),
    cannotWithdrawReason: session.cannotWithdrawReason ?? null,
    participants: session.participants ?? session.students ?? [],
    sessionCount: 1,
  };
}

export const examinerTimeslotServiceReal = {
  // GET /api/examiners/{examinerId}/assignments
  async getAvailableAssignments(examinerId, options = {}) {
    try {
      const { courseId, subjectCode, subjectId, pageNum, pageSize, sort } = options || {};
      const params = {};
      // Backend expects subject filters; map our UI's courseId (code) to subjectCode
      if (subjectCode || courseId) params.subjectCode = subjectCode || courseId;
      if (typeof subjectId !== 'undefined') params.subjectId = subjectId;
      if (typeof pageNum !== 'undefined') params.pageNum = pageNum;
      if (typeof pageSize !== 'undefined') params.pageSize = pageSize;
      if (sort) params.sort = sort;

      const res = await apiClient.get(`/api/examiners/${examinerId}/assignments`, { params });
      // Backend returns ResultListAssignmentResponseDTO with data as array of AssignmentResponseDTO
      const list = res?.data?.data || [];
      // Map to UI-expected minimal shape
      const mapped = list.map((a) => {
        const now = new Date();
        const end = a.endDate ? new Date(a.endDate) : null;
        const raw = (a.status || '').toString().toLowerCase();
        const statusUi = (() => {
          if (end && !isNaN(end) && end < now) return 'deadline_passed';
          if (raw === 'released' || raw === 'in_progress' || raw === 'pending') return 'open';
          if (raw === 'completed' || raw === 'cancelled') return 'deadline_passed';
          return 'open';
        })();
        const maxSessions = a.examinerInfo?.maxSessions ?? 12;
        const currentAssignedSessions = a.examinerInfo?.currentAssignedSessions ?? 0;
        const remainingCapacity = a.examinerInfo?.remainingCapacity ?? Math.max(0, maxSessions - currentAssignedSessions);
        return {
          assignmentId: a.id,
          assignmentName: a.name,
          // Backend does not include course info here; leave undefined
          courseCode: a.subjectCode || a.subjectId || undefined,
          courseName: a.subjectName || undefined,
          assessmentType: (a.type || '')?.toUpperCase(),
          // Unknowns in this endpoint; set safe defaults
          sessionDurationMinutes: a.sessionDurationMinutes ?? null,
          requiredExaminers: a.requiredExaminers ?? null,
          availableTimeslots: a.availableTimeslots ?? 0,
          earliestTimeslot: a.startDate || null,
          latestTimeslot: a.endDate || null,
          examinerInfo: a.examinerInfo || { maxSessions, currentAssignedSessions, remainingCapacity },
          signupDeadline: a.signupDeadline || null,
          status: statusUi,
          urgency: a.urgency || 'low',
        };
      });

      return {
        success: true,
        code: 'OK',
        data: {
          // Wrap in a pagination-like envelope to match current consumers
          pageNum: 0,
          pageSize: mapped.length,
          total: mapped.length,
          data: mapped,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to fetch available assignments',
      };
    }
  },

  // GET /api/examiners/{examinerId}/assignments/{assignmentId}/sessions
  // Fallback: some deployments expose GET /api/assignments/{assignmentId}/sessions?examinerId=...
  async getAvailableSessions(assignmentId, options = {}) {
    const { examinerId, date, venueId, includeFullSlots, pageNum, pageSize } = options || {};
    try {
      const params = {};
      if (date) params.date = date;
      if (venueId) params.venueId = venueId;
      // Prefer status filter supported by swagger: available|all
      if (typeof includeFullSlots !== 'undefined') params.status = includeFullSlots ? 'all' : 'available';
      if (typeof pageNum !== 'undefined') params.pageNum = pageNum;
      if (typeof pageSize !== 'undefined') params.pageSize = pageSize;

      let res;
      if (examinerId) {
        // Primary, swagger-aligned endpoint
        res = await apiClient.get(`/api/examiners/${examinerId}/assignments/${assignmentId}/sessions`, { params });
      } else {
        // Fallback to legacy doc pattern when examinerId not provided explicitly
        res = await apiClient.get(`/api/assignments/${assignmentId}/sessions`, {
          params: { ...params, examinerId },
        });
      }

      const payload = res?.data?.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.sessions)
          ? payload.sessions
          : Array.isArray(payload?.timeSlots)
            ? payload.timeSlots
            : [];

      const sessions = items
        .map((session) => normalizeSession(session))
        .filter(Boolean);

      const assignmentInfo = Array.isArray(payload)
        ? { assignmentId: Number(assignmentId) }
        : (payload?.assignment || { assignmentId: Number(assignmentId) });
      const examinerInfo = Array.isArray(payload)
        ? { maxSessions: 12, currentAssignedSessions: 0, remainingCapacity: 12 }
        : (payload?.examinerInfo || { maxSessions: 12, currentAssignedSessions: 0, remainingCapacity: 12 });

      return {
        success: true,
        code: 'OK',
        data: {
          assignment: assignmentInfo,
          examinerInfo,
          sessions,
          timeSlots: sessions,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to fetch available sessions',
      };
    }
  },

  // POST /api/assignments/{assignmentId}/sessions/assign
  async assignExaminerToSessions(assignmentId, data) {
    try {
      const extracted = Array.isArray(data?.sessionIds)
        ? data.sessionIds
        : Array.isArray(data?.slotAssignments)
          ? data.slotAssignments.map((s) => s.sessionId ?? s.slotId)
          : [];
      const sessionIds = extracted.filter((id) => id !== undefined && id !== null);
      const payload = { sessionIds };
      const res = await apiClient.post(
        `/api/assignments/${assignmentId}/sessions/assign`,
        payload,
        { params: { examinerId: data?.examinerId } }
      );
      const raw = res?.data?.data ?? res?.data ?? {};

      // Support multiple backend response variants
      const idsFromArray = (arr) => (Array.isArray(arr) ? arr.filter((x) => typeof x === 'number') : []);
      const idsFromObjects = (arr) => (Array.isArray(arr) ? arr.map((o) => (typeof o === 'number' ? o : (o?.sessionId ?? o?.id ?? o?.slotId))).filter((x) => typeof x === 'number') : []);

      let successIds = [];
      successIds = successIds.length ? successIds : idsFromArray(raw.addedSessionIds);
      successIds = successIds.length ? successIds : idsFromArray(raw.sessionIds);
      successIds = successIds.length ? successIds : idsFromArray(raw.success);
      successIds = successIds.length ? successIds : idsFromObjects(raw.sessions);
      successIds = successIds.length ? successIds : idsFromObjects(raw.assignedSessions);

      // Final fallback: if API only returned success=true, assume request ids were applied
      if ((!successIds || successIds.length === 0) && res?.data?.success === true && sessionIds.length > 0) {
        successIds = sessionIds;
      }

      const failuresRaw = raw.failures || raw.failedSessions || raw.failed || raw.errors || [];
      const failures = Array.isArray(failuresRaw) ? failuresRaw : [];

      const assignedSessions = successIds.map((id) => ({ sessionId: id, slotId: id, sessionCount: 1 }));

      return {
        success: true,
        code: 'OK',
        data: {
          assignmentId: Number(assignmentId),
          examinerId: data?.examinerId,
          assignedSessions,
          assignedSlots: assignedSessions, // keep legacy consumer happy (expects slotId)
          failedSessions: failures,
          failedSlots: failures,
          stats: {
            addedSessions: assignedSessions.length,
            totalAssignedSessions: undefined,
          },
          partial: failures.length > 0 || assignedSessions.length < sessionIds.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to assign sessions',
      };
    }
  },

  // GET /api/examiners/{examinerId}/schedule
  async getExaminerSchedule(examinerId, options = {}) {
    try {
      const params = {};
      if (options.assignmentId) params.assignmentId = options.assignmentId;
      if (options.date) params.date = options.date;
      if (options.dateFrom) params.dateFrom = options.dateFrom;
      if (options.dateTo) params.dateTo = options.dateTo;
      const res = await apiClient.get(`/api/examiners/${examinerId}/schedule`, { params });
      const body = res?.data?.data || {};

      // If backend already returns assignments, pass through
      if (Array.isArray(body.assignments)) {
        const assignments = body.assignments.map((assignment) => {
          const rawSessions = assignment.sessions ?? assignment.slots ?? [];
          const normalizedSessions = rawSessions
            .map((session) => normalizeSession(session))
            .filter(Boolean);
          return {
            ...assignment,
            sessions: normalizedSessions,
            slots: normalizedSessions,
          };
        });
        return { success: true, code: 'OK', data: { assignments } };
      }

      // Otherwise map from a flat schedule structure
      const slots = Array.isArray(body.slots) ? body.slots : [];
      const fallbackSessions = slots
        .map((slot) => normalizeSession(slot))
        .filter(Boolean);

      return {
        success: true,
        code: 'OK',
        data: {
          assignments: [
            {
              assignmentId: body.assignmentId || null,
              assignmentName: body.assignmentName || 'Assigned Sessions',
              courseCode: body.courseCode || '',
              courseName: body.courseName || '',
              sessions: fallbackSessions,
              slots: fallbackSessions,
            },
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to fetch examiner schedule',
      };
    }
  },

  // DELETE /api/assignments/{assignmentId}/sessions/{sessionId}/unassign?examinerId=...
  async unassignExaminerFromSession(assignmentId, sessionId, examinerId) {
    try {
      const res = await apiClient.delete(`/api/assignments/${assignmentId}/sessions/${sessionId}/unassign`, { params: { examinerId } });
      const ok = res?.data?.success === true || res?.data === true;
      return {
        success: ok,
        code: ok ? 'OK' : 'FAILED',
        data: ok
          ? { assignmentId: Number(assignmentId), sessionId: Number(sessionId), examinerId }
          : null,
        message: ok ? undefined : 'Failed to unassign from session',
      };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to unassign from session',
      };
    }
  },

  // Convenience wrapper matching hook usage. Requires assignmentId.
  async withdrawFromSession(sessionId, options = {}) {
    const { examinerId, assignmentId } = options || {};
    if (!assignmentId) {
      return {
        success: false,
        code: 'BAD_REQUEST',
        data: null,
        message: 'assignmentId is required to withdraw from a session',
      };
    }
    return this.unassignExaminerFromSession(assignmentId, sessionId, examinerId);
  },
};

// Backwards compatibility aliases (legacy naming)
examinerTimeslotServiceReal.getAvailableTimeslots = examinerTimeslotServiceReal.getAvailableSessions;
examinerTimeslotServiceReal.assignExaminerToTimeslots = examinerTimeslotServiceReal.assignExaminerToSessions;
examinerTimeslotServiceReal.unassignExaminerFromTimeslot = examinerTimeslotServiceReal.unassignExaminerFromSession;
examinerTimeslotServiceReal.withdrawFromTimeslot = examinerTimeslotServiceReal.withdrawFromSession;

export default examinerTimeslotServiceReal;
