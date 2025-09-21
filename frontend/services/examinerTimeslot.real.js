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

function normalizeSession(session, examinerId, assignmentIdHint) {
  if (!session) return null;

  const sessionId = session.sessionId ?? session.id ?? session.slotId;
  const assignmentId = session.assignmentId ?? assignmentIdHint ?? null;
  const start = session.start ?? toIsoFromDateAndLocalTime(session.date, session.startTime);
  const end = session.end ?? toIsoFromDateAndLocalTime(session.date, session.endTime);
  const venue = session.venue
    || (session.venueId || session.venueName
      ? { venueId: session.venueId, name: session.venueName }
      : null);

  const required = session.requiredExaminers ?? session.coverage?.required ?? session.required ?? null;

  // Get assigned examiners array and count
  const assignedExaminers = session.assignedExaminers || [];
  const assigned = session.currentExaminers
    ?? session.coverage?.assigned
    ?? assignedExaminers.length;

  // Check if current examiner is already assigned to this session
  const isExaminerAlreadyAssigned = examinerId && Array.isArray(assignedExaminers)
    ? assignedExaminers.some(examiner =>
        examiner.id === examinerId ||
        examiner.examinerId === examinerId ||
        examiner === examinerId
      )
    : false;

  // Session is fully staffed when assigned count meets or exceeds required
  const remainingCapacity = typeof session.remainingCapacity === 'number' ? session.remainingCapacity : null;
  const status = (session.status || '').toString().toUpperCase();
  const publishedToExaminer = session.publishedToExaminer;

  const isFullyStaffed = session.coverage?.isFullyStaffed
    ?? (remainingCapacity != null
      ? remainingCapacity <= 0
      : (required != null && assigned != null ? assigned >= required : false));

  const conflict = session.conflict ?? false;

  // Use the calculated isExaminerAlreadyAssigned instead of generic alreadyAssigned
  const alreadyAssigned = session.assigned ?? isExaminerAlreadyAssigned;

  const rawAvailability = session.availability || {};

  // Determine if session can be selected:
  // - Cannot select if already assigned to this examiner
  // - Cannot select if fully staffed (no over-cover)
  // - Cannot select if there's a time conflict
  let derivedReason = null;
  if (alreadyAssigned) {
    derivedReason = 'ALREADY_ASSIGNED';
  } else if (conflict) {
    derivedReason = 'TIME_CONFLICT';
  } else if (!rawAvailability?.canSelect) {
    derivedReason = rawAvailability?.reason ?? null;
  } else if (publishedToExaminer === false) {
    derivedReason = 'NOT_PUBLISHED';
  } else if (status === 'CANCELLED') {
    derivedReason = 'SESSION_CANCELLED';
  } else if (status === 'DRAFT' || status === 'CREATED' || status === 'PENDING') {
    derivedReason = 'SESSION_NOT_OPEN';
  } else if (isFullyStaffed) {
    derivedReason = 'SESSION_CLOSED';
  }

  const availability = {
    canSelect: rawAvailability.canSelect
      ?? (derivedReason === null),
    reason: rawAvailability.reason ?? derivedReason,
  };

  const bookingCount = session.bookingCount
    ?? session.bookedCount
    ?? session.studentCapacity?.bookedCount
    ?? 0;
  const capacity = session.capacity
    ?? session.studentCapacity?.capacity
    ?? session.studentCapacity?.total
    ?? null;

  const rawAssessmentType = session.assessmentType
    || session.assignmentType
    || session.type
    || null;
  const normalizedAssessmentType = (() => {
    if (rawAssessmentType) return rawAssessmentType.toString().toUpperCase();
    if (required === 1) return 'INDIVIDUAL';
    if (required === 0 || required == null) return 'MIX';
    return 'GROUP';
  })();

  return {
    sessionId,
    slotId: sessionId,
    start,
    end,
    timezone: session.timezone || 'Australia/Melbourne',
    venue,
    assignmentId,
    requiredExaminers: required,
    currentExaminers: assigned,
    assignedExaminers, // Include the actual examiners list for UI display
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
    isExaminerAlreadyAssigned, // Add flag for UI to show "You're already assigned"
    assessmentType: normalizedAssessmentType,
  };
}

export const examinerTimeslotServiceReal = {
  // GET /api/examiners/{examinerId}/assignments
  async getAvailableAssignments(examinerId, options = {}) {
    try {
      const { courseId, subjectCode, subjectId, pageNum, pageSize, sort } = options || {};
      const payload = {};

      if (typeof examinerId === 'undefined' || examinerId === null) {
        throw new Error('examinerId is required to list assignments');
      }

      payload.examinerId = examinerId;

      const numericCourseFilter = [subjectId, courseId]
        .map((value) => (value === '' || value === null || typeof value === 'undefined' ? undefined : Number(value)))
        .find((value) => Number.isInteger(value));
      if (Number.isInteger(numericCourseFilter)) payload.courseId = numericCourseFilter;

      if (sort) payload.sort = sort;

      const res = await apiClient.post('/api/examiners/assignments/list', payload);
      const rawData = Array.isArray(res?.data?.data) ? res.data.data : [];

      // Optional client-side filter when API payload does not accept subjectCode strings
      const filtered = subjectCode
        ? rawData.filter((assignment) => assignment.subjectCode === subjectCode || assignment.subjectId === subjectCode)
        : rawData;

      const mapped = filtered.map((a) => {
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

      const requestedPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : mapped.length;
      const requestedPageNum = Number.isInteger(pageNum) && pageNum >= 0 ? pageNum : 0;
      const startIndex = requestedPageNum * requestedPageSize;
      const paginated = mapped.slice(startIndex, startIndex + requestedPageSize);

      return {
        success: true,
        code: 'OK',
        data: {
          pageNum: requestedPageNum,
          pageSize: requestedPageSize,
          total: mapped.length,
          data: paginated,
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

  // POST /api/examiners/{examinerId}/assignments/{assignmentId}/sessions/query
  // Fallback: POST /api/assignments/{assignmentId}/timeslots/query
  async getAvailableSessions(assignmentId, options = {}) {
    const { examinerId, date, venueId, includeFullSlots, status, pageNum, pageSize } = options || {};
    try {
      const body = {};
      if (date) body.date = date;
      if (venueId) body.venueId = Number(venueId);
      const resolvedStatus = status
        ? status
        : typeof includeFullSlots !== 'undefined'
          ? (includeFullSlots ? 'ALL' : 'AVAILABLE')
          : undefined;
      if (resolvedStatus) body.status = resolvedStatus.toString().toUpperCase();

      let res;
      if (examinerId != null) {
        res = await apiClient.post(
          `/api/examiners/${examinerId}/assignments/${assignmentId}/sessions/query`,
          body
        );
      } else {
        res = await apiClient.post(
          `/api/assignments/${assignmentId}/timeslots/query`,
          body
        );
      }

      const payload = res?.data?.data || {};
      const itemsRaw = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(payload.sessions)
          ? payload.sessions
          : Array.isArray(payload.timeSlots)
            ? payload.timeSlots
            : [];

      const items = itemsRaw.map((session) => normalizeSession(session, examinerId, Number(assignmentId))).filter(Boolean);

      const requestedPageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : items.length;
      const requestedPageNum = Number.isInteger(pageNum) && pageNum >= 0 ? pageNum : 0;
      const startIndex = requestedPageNum * requestedPageSize;
      const paginated = items.slice(startIndex, startIndex + requestedPageSize);

      const assignmentInfo = payload.assignment || { assignmentId: Number(assignmentId) };
      const examinerInfo = payload.examinerInfo || null;
      const summary = payload.summary || null;

      return {
        success: true,
        code: 'OK',
        data: {
          assignment: assignmentInfo,
          examinerInfo,
          summary,
          sessions: paginated,
          timeSlots: paginated,
          total: items.length,
          pageNum: requestedPageNum,
          pageSize: requestedPageSize,
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

      const examinerId = data?.examinerId;
      if (examinerId == null) {
        throw new Error('examinerId is required to assign sessions');
      }

      const res = await apiClient.post(
        `/api/assignments/${assignmentId}/sessions/assign`,
        {
          examinerId,
          sessionIds,
        }
      );

      const raw = res?.data?.data ?? {};
      const idsFromArray = (arr) => (Array.isArray(arr) ? arr.map((x) => Number(x)).filter((x) => !Number.isNaN(x)) : []);
      const successIds = idsFromArray(raw.updatedSessionIds);
      const finalSuccessIds = successIds.length > 0
        ? successIds
        : (res?.data?.success === true ? sessionIds : []);

      const failures = sessionIds.filter((id) => !finalSuccessIds.includes(id));
      const assignedSessions = finalSuccessIds.map((id) => ({ sessionId: id, slotId: id, sessionCount: 1 }));

      return {
        success: true,
        code: 'OK',
        data: {
          assignmentId: Number(assignmentId),
          examinerId,
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
        message: error.response?.data?.message || error.message || 'Failed to assign sessions',
      };
    }
  },

  // POST /api/examiners/{examinerId}/schedule
  async getExaminerSchedule(examinerId, options = {}) {
    try {
      const requestBody = {};
      if (options.assignmentId != null) requestBody.assignmentId = Number(options.assignmentId);

      const res = await apiClient.post(`/api/examiners/${examinerId}/schedule`, requestBody);
      const body = res?.data?.data || {};

      const applyDateFilters = (sessions) => {
        if (!Array.isArray(sessions)) return [];

        const hasDateExact = typeof options.date === 'string';
        const hasFrom = typeof options.dateFrom === 'string';
        const hasTo = typeof options.dateTo === 'string';

        if (!hasDateExact && !hasFrom && !hasTo) return sessions;

        const dateFrom = hasDateExact ? new Date(options.date) : (hasFrom ? new Date(options.dateFrom) : null);
        const dateTo = hasDateExact ? new Date(options.date) : (hasTo ? new Date(options.dateTo) : null);

        return sessions.filter((session) => {
          if (!session?.start) return false;
          const startDate = new Date(session.start);

          let within = true;
          if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            if (startDate < from) within = false;
          }
          if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            if (startDate > to) within = false;
          }

          return within;
        });
      };

      // If backend already returns assignments, pass through
      if (Array.isArray(body.assignments)) {
        const assignments = body.assignments.map((assignment) => {
          const rawSessions = assignment.sessions ?? assignment.slots ?? [];
          const normalizedSessions = applyDateFilters(
            rawSessions
              .map((session) => normalizeSession(session, examinerId, assignment.assignmentId))
              .filter(Boolean)
          );
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
        .map((slot) => normalizeSession(slot, examinerId, body.assignmentId ?? null))
        .filter(Boolean);

      const filteredFallback = applyDateFilters(fallbackSessions);

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
              sessions: filteredFallback,
              slots: filteredFallback,
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

  // POST /api/assignments/{assignmentId}/sessions/unassign
  async unassignExaminerFromSession(assignmentId, sessionId, examinerId) {
    try {
      const res = await apiClient.post(
        `/api/assignments/${assignmentId}/sessions/unassign`,
        {
          examinerId,
          sessionId: Number(sessionId),
        }
      );

      const ok = res?.data?.success === true && res?.data?.data?.success !== false;
      const returnedSessionId = res?.data?.data?.sessionId ?? Number(sessionId);
      return {
        success: ok,
        code: ok ? 'OK' : 'FAILED',
        data: ok
          ? { assignmentId: Number(assignmentId), sessionId: returnedSessionId, examinerId }
          : null,
        message: ok ? undefined : 'Failed to unassign from session',
      };
    } catch (error) {
      // Fallback to legacy claim endpoint if new DTO-based API is unavailable
      if (error.response && error.response.status === 404 && examinerId != null) {
        try {
          const legacyRes = await apiClient.delete(`/api/examiners/${examinerId}/sessions/${sessionId}/claim`);
          const legacyOk = legacyRes?.data?.success === true || legacyRes?.data === true;
          return {
            success: legacyOk,
            code: legacyOk ? 'OK' : 'FAILED',
            data: legacyOk
              ? { assignmentId: Number(assignmentId), sessionId: Number(sessionId), examinerId }
              : null,
            message: legacyOk ? undefined : 'Failed to unassign from session',
          };
        } catch (legacyError) {
          return {
            success: false,
            code: 'SERVER_ERROR',
            data: null,
            message: legacyError.response?.data?.message || legacyError.message || 'Failed to unassign from session',
          };
        }
      }
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to unassign from session',
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
