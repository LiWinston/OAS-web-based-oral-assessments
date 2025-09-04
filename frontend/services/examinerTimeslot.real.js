import apiClient from '@/services/apiClient.js';

// Helper to build ISO datetime strings from date + LocalTime
function toIsoFromDateAndLocalTime(dateStr, timeObj) {
  if (!dateStr || !timeObj) return null;
  const h = String(timeObj.hour ?? 0).padStart(2, '0');
  const m = String(timeObj.minute ?? 0).padStart(2, '0');
  const local = new Date(`${dateStr}T${h}:${m}:00`);
  return local.toISOString();
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
          examinerInfo: a.examinerInfo || { maxSessions: 0, currentAssignedSessions: 0, remainingCapacity: 0 },
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

  // GET /api/assignments/{assignmentId}/timeslots?examinerId=...
  async getAvailableTimeslots(assignmentId, options = {}) {
    const { examinerId, date, includeFullSlots, pageNum, pageSize } = options || {};
    try {
      const res = await apiClient.get(`/api/assignments/${assignmentId}/timeslots`, {
        params: { examinerId, date, includeFullSlots, pageNum, pageSize },
      });
      // Contract doc wraps assignment + examinerInfo + timeSlots; some backends may return array directly
      const payload = res?.data?.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.timeSlots)
          ? payload.timeSlots
          : [];
      const timeSlots = items.map((t) => {
        // Support both shapes: explicit start/end or date + LocalTime
        const start = t.start || toIsoFromDateAndLocalTime(t.date, t.startTime);
        const end = t.end || toIsoFromDateAndLocalTime(t.date, t.endTime);
        const full = t.isFull ?? t.full ?? false;
        const conflict = t.conflict ?? false;
        const assigned = t.assigned ?? false;
        const availability = t.availability || {
          canSelect: !full && !conflict && !assigned,
          reason: full ? 'SLOT_FULL' : conflict ? 'TIME_CONFLICT' : assigned ? 'ALREADY_ASSIGNED' : null,
        };
        return {
          slotId: t.slotId ?? t.id,
          start,
          end,
          timezone: t.timezone || 'Australia/Melbourne',
          venue: t.venue || (t.venueId ? { venueId: t.venueId } : null),
          sessionCount: t.sessionCount ?? 1,
          requiredExaminers: t.requiredExaminers,
          currentExaminers: t.currentExaminers,
          isFull: full,
          availability,
        };
      });

      const assignmentInfo = Array.isArray(payload)
        ? { assignmentId: Number(assignmentId) }
        : (payload?.assignment || { assignmentId: Number(assignmentId) });
      const examinerInfo = Array.isArray(payload) ? undefined : payload?.examinerInfo;

      return { success: true, code: 'OK', data: { assignment: assignmentInfo, examinerInfo, timeSlots } };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to fetch available timeslots',
      };
    }
  },

  // POST /api/assignments/{assignmentId}/timeslots/assign
  async assignExaminerToTimeslots(assignmentId, data) {
    try {
      const slotIds = (data?.slotAssignments || []).map((s) => s.slotId);
      const payload = { examinerId: data?.examinerId, slotIds };
      const res = await apiClient.post(`/api/assignments/${assignmentId}/timeslots/assign`, payload);
      const result = res?.data?.data || {};
      const successIds = Array.isArray(result.success) ? result.success : [];
      const failures = Array.isArray(result.failures) ? result.failures : [];

      const assignedSlots = successIds.map((id) => ({ slotId: id, sessionCount: 1 }));

      return {
        success: true,
        code: 'OK',
        data: {
          assignmentId: Number(assignmentId),
          examinerId: data?.examinerId,
          assignedSlots,
          failedSlots: failures,
          stats: {
            addedSessions: assignedSlots.length,
            totalAssignedSessions: undefined,
          },
          partial: failures.length > 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to assign timeslots',
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
        return { success: true, code: 'OK', data: { assignments: body.assignments } };
      }

      // Otherwise map from a flat schedule structure
      const slots = Array.isArray(body.slots) ? body.slots : [];
      const mappedSlots = slots.map((s) => ({
        slotId: s.slotId,
        start: toIsoFromDateAndLocalTime(s.date, s.startTime),
        end: toIsoFromDateAndLocalTime(s.date, s.endTime),
        venue: s.venue || null,
        sessionCount: s.sessionCount ?? 1,
        requiredExaminers: s.requiredExaminers,
        currentExaminers: s.currentExaminers,
        isAssigned: true,
        isBooked: s.isBooked ?? (s.bookingCount > 0),
        bookingCount: s.bookingCount ?? 0,
        canWithdraw: s.canWithdraw ?? (s.bookingCount === 0),
        cannotWithdrawReason: s.cannotWithdrawReason,
      }));

      return { success: true, code: 'OK', data: { assignments: [{ assignmentId: body.assignmentId || null, assignmentName: body.assignmentName || 'Assigned Slots', courseCode: body.courseCode || '', courseName: body.courseName || '', slots: mappedSlots }] } };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to fetch examiner schedule',
      };
    }
  },

  // DELETE /api/assignments/{assignmentId}/timeslots/{slotId}/unassign?examinerId=...
  async unassignExaminerFromTimeslot(assignmentId, slotId, examinerId) {
    try {
      const res = await apiClient.delete(`/api/assignments/${assignmentId}/timeslots/${slotId}/unassign`, { params: { examinerId } });
      const ok = res?.data?.success === true || res?.data === true;
      return {
        success: ok,
        code: ok ? 'OK' : 'FAILED',
        data: ok
          ? { assignmentId: Number(assignmentId), slotId: Number(slotId), examinerId }
          : null,
        message: ok ? undefined : 'Failed to unassign from timeslot',
      };
    } catch (error) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        data: null,
        message: error.response?.data?.message || 'Failed to unassign from timeslot',
      };
    }
  },

  // Convenience wrapper matching hook usage. Requires assignmentId.
  async withdrawFromTimeslot(slotId, options = {}) {
    const { examinerId, assignmentId } = options || {};
    if (!assignmentId) {
      return {
        success: false,
        code: 'BAD_REQUEST',
        data: null,
        message: 'assignmentId is required to withdraw from a timeslot',
      };
    }
    return this.unassignExaminerFromTimeslot(assignmentId, slotId, examinerId);
  },
};

export default examinerTimeslotServiceReal;
