import apiClient from '@/services/apiClient.js';
import { to24Hour } from '@/lib/timeMath.js';

/**
 * Unified Course Admin Timeslot Service
 * - Calls real endpoints under `/admin/assignments/{assignmentId}/...`
 * - Always returns mock-shaped data expected by current hooks/mappers
 * - Catches errors and still resolves with { success: true, data, message }
 */

// Toggle: use mocks vs. call real API
// Support both env var names; default to mocks unless explicitly disabled
const mockFlag = process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'true';
const USE_MOCKS = String(mockFlag) !== 'false';

// Helper to optionally call API without triggering axios error logging in dev
// When USE_MOCKS is true, we skip network calls entirely to avoid 404 logs
async function callApiIfEnabled(fn) {
  if (!USE_MOCKS && typeof fn === 'function') {
    try {
      return await fn();
    } catch (e) {
      // Log diagnostic details without throwing (interceptor already logs a summary)
      const status = e?.response?.status;
      const url = e?.config?.url;
      const method = e?.config?.method;
      const data = e?.response?.data;
      // eslint-disable-next-line no-console
      console.warn('[courseAdminTimeslotService] API error', { method, url, status, data });
      // swallow errors; service returns mock-shaped data below
    }
  }
}

// Extract payload from various backend response shapes
function extractData(resp) {
  if (!resp) return null;
  const d = resp.data;
  if (d == null) return null;
  if (typeof d === 'object') {
    if (Object.prototype.hasOwnProperty.call(d, 'data')) return d.data;
    if (Object.prototype.hasOwnProperty.call(d, 'timeSlots')) return d.timeSlots;
    if (Object.prototype.hasOwnProperty.call(d, 'dates')) return d.dates;
  }
  return d;
}

function success(data, message = '') {
  return { success: true, data, message };
}

// In-memory mock state to keep UI stable and interactive
let mockSessionConfigs = {};

let mockTimeSlots = [
  {
    id: 1,
    date: '2025-08-15',
    startTime: '09:00',
    endTime: '10:30',
    venue: 'Engineering Building, Room 405',
    requiredExaminers: 2,
    sessionCount: 3,
    status: 'full',
    assignedExaminers: [
      { id: 1, name: 'Dr. Emma Thompson', email: 'emma.thompson@uni.edu' },
      { id: 2, name: 'Dr. Michael Chen', email: 'michael.chen@uni.edu' }
    ]
  },
  {
    id: 2,
    date: '2025-08-15',
    startTime: '11:00',
    endTime: '12:30',
    venue: 'Engineering Building, Room 405',
    requiredExaminers: 2,
    sessionCount: 3,
    status: 'partial',
    assignedExaminers: [
      { id: 1, name: 'Dr. Emma Thompson', email: 'emma.thompson@uni.edu' }
    ]
  },
  {
    id: 3,
    date: '2025-08-16',
    startTime: '14:00',
    endTime: '16:00',
    venue: 'ICT Building, Room 203',
    requiredExaminers: 2,
    sessionCount: 4,
    status: 'empty',
    assignedExaminers: []
  }
];

let mockExaminers = [
  { id: 1, name: 'Dr. Emma Thompson', email: 'emma.thompson@uni.edu', maxSessions: 40 },
  { id: 2, name: 'Dr. Michael Chen', email: 'michael.chen@uni.edu', maxSessions: 40 },
  { id: 3, name: 'Dr. Sarah Johnson', email: 'sarah.johnson@uni.edu', maxSessions: 40 },
  { id: 4, name: 'Prof. David Williams', email: 'david.williams@uni.edu', maxSessions: 40 }
];

// Helpers
const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));
const generateId = () => Math.max(...mockTimeSlots.map((s) => s.id), 0) + 1;
const determineStatus = (assigned, required) => {
  if (assigned === 0) return 'empty';
  if (assigned < required) return 'partial';
  return 'full';
};
const withStatus = (slot) => ({
  ...slot,
  status: determineStatus(slot.assignedExaminers?.length || 0, slot.requiredExaminers || 0),
});

// NOTE: Backend paths are under /api per Swagger
const base = (assignmentId) => `/api/admin/assignments/${assignmentId}`;

export const courseAdminTimeslotService = {
  // 1) Session Configuration
  async getSessionConfig(assignmentId) {
    const resp = await callApiIfEnabled(() =>
      apiClient.get(`${base(assignmentId)}/session-config`)
    );

    if (!USE_MOCKS && resp) {
      const data = extractData(resp) || {};
      return success(data, 'Session configuration (api)');
    }

    await delay();
    const config = mockSessionConfigs[assignmentId] || {
      assignmentId,
      sessionLength: 30,
      gapTime: 5,
      examinersPerSession: 2,
      isConfigured: false,
    };
    return success(config, 'Session configuration (mock)');
  },

  async saveSessionConfig(assignmentId, body) {
    const resp = await callApiIfEnabled(() =>
      apiClient.put(`${base(assignmentId)}/session-config`, body)
    );

    if (!USE_MOCKS && resp) {
      const data = extractData(resp) || body || {};
      return success(data, 'Session configuration saved (api)');
    }

    await delay();
    mockSessionConfigs[assignmentId] = {
      assignmentId,
      ...body,
      isConfigured: true,
    };
    return success(mockSessionConfigs[assignmentId], 'Session configuration saved (mock)');
  },

  // 5) Calendar Integration
  async getCalendar(assignmentId, month) {
    const url = `${base(assignmentId)}/calendar`;
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] GET', url, { month });
    const resp = await callApiIfEnabled(() => apiClient.get(url, { params: { month } }));

    if (!USE_MOCKS && resp) {
      // eslint-disable-next-line no-console
      console.log('[courseAdminTimeslotService] GET calendar response', {
        status: resp?.status,
        data: resp?.data
      });
      const raw = extractData(resp);
      const dates = raw?.dates || raw || {};
      return success(dates, 'Calendar (api)');
    }

    await delay();
    // Produce calendar summary keyed by YYYY-MM-DD with { timeSlots, status, sessions }
    const date = new Date(`${month}-01T00:00:00`);
    const calendarData = {};
    const targetMonth = date.getMonth();
    while (date.getMonth() === targetMonth) {
      const d = date.toISOString().slice(0, 10);
      const daySlots = mockTimeSlots.filter((s) => s.date === d);
      if (daySlots.length) {
        const statuses = daySlots.map((s) => s.status);
        const overall = statuses.every((s) => s === 'full')
          ? 'full'
          : statuses.some((s) => s === 'partial' || s === 'full')
          ? 'partial'
          : 'empty';
        calendarData[d] = {
          timeSlots: daySlots.length,
          status: overall,
          sessions: daySlots.reduce((sum, s) => sum + (s.sessionCount || 0), 0),
        };
      }
      date.setDate(date.getDate() + 1);
    }
    return success(calendarData, 'Calendar (mock)');
  },

  // 2) Time Slot Management
  async createTimeSlotsBatch(assignmentId, { timeSlots }) {
    console.log(timeSlots)
    
    // Prepare request body for real API shape
    const fallbackVenueId = process.env.NEXT_PUBLIC_TEST_VENUE_ID
      ? Number(process.env.NEXT_PUBLIC_TEST_VENUE_ID)
      : undefined;

    const requestSlots = (timeSlots || []).map((slot) => {
      const start24 = slot.startTime && String(slot.startTime).includes(' ')
        ? to24Hour(slot.startTime)
        : slot.startTime;
      const end24 = slot.endTime && String(slot.endTime).includes(' ')
        ? to24Hour(slot.endTime)
        : slot.endTime;

      // Derive a venueId if provided directly or via env for testing
      let venueId = slot.venueId;
      if (venueId == null) {
        const parsed = Number(slot.venue);
        if (!Number.isNaN(parsed)) venueId = parsed;
      }
      if (venueId == null && fallbackVenueId != null) venueId = fallbackVenueId;

      return {
        date: slot.date,
        startTime: start24,
        endTime: end24,
        sessionCount: slot.sessionCount,
        venueId,
      };
    });

    // Validate venueId presence to avoid opaque 400s
    const missingVenue = requestSlots.find((s) => s.venueId == null);
    if (!USE_MOCKS && missingVenue) {
      return { success: false, data: [], message: 'Missing venueId: set NEXT_PUBLIC_TEST_VENUE_ID or provide slot.venueId' };
    }

    const resp = await callApiIfEnabled(() =>
      apiClient.post(`${base(assignmentId)}/timeslots/batch`, { timeSlots: requestSlots })
    );

    if (!USE_MOCKS && resp) {
      const raw = extractData(resp);
      // Accept arrays or wrapped objects { timeSlots: [...] }
      const arr = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.timeSlots)
        ? raw.timeSlots
        : Array.isArray(raw?.data?.timeSlots)
        ? raw.data.timeSlots
        : [];

      const normalized = arr.map((slot) =>
        withStatus({
          id: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          venue: slot.venue,
          requiredExaminers: slot.requiredExaminers ?? slot.examinersPerSession ?? 0,
          sessionCount: slot.sessionCount,
          assignedExaminers: slot.assignedExaminers || [],
        })
      );
      return success(normalized, 'Time slots created (api)');
    }

    await delay();
    // naive conflict detection by same date/venue/start
    const conflicts = [];
    timeSlots.forEach((slot) => {
      const exists = mockTimeSlots.find(
        (s) => s.date === slot.date && s.venue === slot.venue && s.startTime === slot.startTime,
      );
      if (exists) conflicts.push(`${slot.date} ${slot.startTime} ${slot.venue}`);
    });
    if (conflicts.length) {
      // still return success true with empty create to keep UI flowing
      return success([], `Conflicts detected (mock): ${conflicts.join(', ')}`);
    }

    const created = timeSlots.map((slot) =>
      withStatus({
        ...slot,
        id: generateId(),
        assignedExaminers: [],
        status: 'empty',
      }),
    );
    mockTimeSlots.push(...created);
    return success(created, `${created.length} time slots created (mock)`);
  },

  async getTimeSlots(assignmentId, filters = {}) {
    const url = `${base(assignmentId)}/timeslots`;
    // New backend: POST with filters { status, dateFrom, dateTo }
    const payload = {};
    if (filters && typeof filters === 'object') {
      if (filters.status) payload.status = filters.status;
      if (filters.date) {
        payload.dateFrom = filters.date;
        payload.dateTo = filters.date;
      } else {
        if (filters.dateFrom) payload.dateFrom = filters.dateFrom;
        if (filters.dateTo) payload.dateTo = filters.dateTo;
      }
    }
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] POST', url, { payload });
    const resp = await callApiIfEnabled(() => apiClient.post(url, payload));

    if (!USE_MOCKS && resp) {
      // eslint-disable-next-line no-console
      console.log('[courseAdminTimeslotService] GET timeslots response', {
        status: resp?.status,
        data: resp?.data
      });
      const raw = extractData(resp);
      const arr = Array.isArray(raw?.timeSlots) ? raw.timeSlots : Array.isArray(raw) ? raw : [];
      const normalized = arr.map((slot) => withStatus({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venue: slot.venueName,
        venueId: slot.venueId,
        requiredExaminers: slot.requiredExaminers,
        sessionCount: slot.sessionCount,
        status: slot.status,
        assignedExaminers: slot.assignedExaminers || []
      }));
      return success(normalized, 'Time slots (api)');
    }

    await delay();
    let res = [...mockTimeSlots];
    if (filters.date) res = res.filter((s) => s.date === filters.date);
    if (filters.status) res = res.filter((s) => s.status === filters.status);
    if (filters.dateFrom) res = res.filter((s) => s.date >= filters.dateFrom);
    if (filters.dateTo) res = res.filter((s) => s.date <= filters.dateTo);
    return success(res.map(withStatus), 'Time slots (mock)');
  },

  async updateTimeSlot(assignmentId, timeSlotId, body) {
    const url = `${base(assignmentId)}/timeslots/${timeSlotId}`;
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] PUT', url, { body });
    const req = {
      date: body.date,
      startTime: body.startTime && String(body.startTime).includes(' ') ? to24Hour(body.startTime) : body.startTime,
      endTime: body.endTime && String(body.endTime).includes(' ') ? to24Hour(body.endTime) : body.endTime,
      sessionCount: body.sessionCount,
      venueId: body.venueId,
      // Optional: allow backend to accept requiredExaminers if supported
      requiredExaminers: body.requiredExaminers,
      // Backend field: assignExaminerIds only
      assignExaminerIds: Array.isArray(body.assignExaminerIds)
        ? body.assignExaminerIds
        : Array.isArray(body.assignedExaminerIds)
          ? body.assignedExaminerIds
          : undefined
    };
    const resp = await callApiIfEnabled(() => apiClient.put(url, req));

    if (!USE_MOCKS && resp) {
      // eslint-disable-next-line no-console
      console.log('[courseAdminTimeslotService] PUT timeslot response', {
        status: resp?.status,
        data: resp?.data
      });
      const raw = extractData(resp);
      const slot = raw?.timeSlot || raw; // tolerate either
      const normalized = withStatus({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venue: slot.venueName,
        venueId: slot.venueId,
        requiredExaminers: slot.requiredExaminers,
        sessionCount: slot.sessionCount,
        status: slot.status,
        assignedExaminers: slot.assignedExaminers || []
      });
      return success(normalized, 'Time slot updated (api)');
    }

    await delay();
    const idx = mockTimeSlots.findIndex((s) => s.id === timeSlotId);
    if (idx === -1) {
      return success(null, 'Time slot not found (mock)');
    }
    const updated = withStatus({ ...mockTimeSlots[idx], ...body });
    mockTimeSlots[idx] = updated;
    return success(updated, 'Time slot updated (mock)');
  },

  async deleteTimeSlots(assignmentId, ids) {
    const url = `${base(assignmentId)}/timeslots`;
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] DELETE', url, { ids });
    const resp = await callApiIfEnabled(() => apiClient.delete(url, { data: { timeSlotIds: ids } }));

    if (!USE_MOCKS && resp) {
      // eslint-disable-next-line no-console
      console.log('[courseAdminTimeslotService] DELETE timeslots response', {
        status: resp?.status,
        data: resp?.data
      });
      const raw = extractData(resp);
      const deletedIds = Array.isArray(raw) ? raw : raw?.deletedIds || ids;
      return success({ deletedCount: deletedIds.length, deletedIds }, 'Time slots deleted (api)');
    }

    await delay();
    const before = mockTimeSlots.length;
    mockTimeSlots = mockTimeSlots.filter((s) => !ids.includes(s.id));
    const deleted = before - mockTimeSlots.length;
    return success({ deletedCount: deleted }, `${deleted} deleted (mock)`);
  },

  async duplicateTimeSlot(assignmentId, timeSlotId, body = {}) {
    const url = `${base(assignmentId)}/timeslots/${timeSlotId}/duplicate`;
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] POST', url, { body });
    const resp = await callApiIfEnabled(() => apiClient.post(url, body));

    if (!USE_MOCKS && resp) {
      // eslint-disable-next-line no-console
      console.log('[courseAdminTimeslotService] POST duplicate response', {
        status: resp?.status,
        data: resp?.data
      });
      const slot = extractData(resp);
      const normalized = withStatus({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venue: slot.venueName,
        venueId: slot.venueId,
        requiredExaminers: slot.requiredExaminers,
        sessionCount: slot.sessionCount,
        status: slot.status,
        assignedExaminers: slot.assignedExaminers || []
      });
      return success(normalized, 'Time slot duplicated (api)');
    }

    await delay();
    const orig = mockTimeSlots.find((s) => s.id === timeSlotId);
    if (!orig) return success(null, 'Original not found (mock)');

    let newDate = body.date;
    if (!newDate) {
      const d = new Date(`${orig.date}T00:00:00`);
      d.setDate(d.getDate() + 1);
      newDate = d.toISOString().slice(0, 10);
    }
    const dup = withStatus({ ...orig, id: generateId(), date: newDate, assignedExaminers: [] });
    dup.status = 'empty';
    mockTimeSlots.push(dup);
    return success(dup, 'Time slot duplicated (mock)');
  },

  // Create single time slot via new endpoint
  async createTimeSlot(assignmentId, body) {
    const url = `${base(assignmentId)}/timeslots/create`;
    const req = {
      date: body.date,
      startTime: body.startTime && String(body.startTime).includes(' ') ? to24Hour(body.startTime) : body.startTime,
      endTime: body.endTime && String(body.endTime).includes(' ') ? to24Hour(body.endTime) : body.endTime,
      sessionCount: body.sessionCount,
      venueId: body.venueId,
      requiredExaminers: body.requiredExaminers,
      assignExaminerIds: Array.isArray(body.assignExaminerIds)
        ? body.assignExaminerIds
        : Array.isArray(body.assignedExaminerIds)
          ? body.assignedExaminerIds
          : undefined
    };
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] POST', url, { body: req });
    const resp = await callApiIfEnabled(() => apiClient.post(url, req));

    if (!USE_MOCKS && resp) {
      const slot = extractData(resp);
      const normalized = withStatus({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venue: slot.venueName || slot.venue,
        venueId: slot.venueId,
        requiredExaminers: slot.requiredExaminers,
        sessionCount: slot.sessionCount,
        status: slot.status,
        assignedExaminers: slot.assignedExaminers || []
      });
      return success(normalized, 'Time slot created (api)');
    }

    // Mock create
    await delay();
    const created = withStatus({
      id: generateId(),
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      venue: body.venue,
      venueId: body.venueId,
      requiredExaminers: body.requiredExaminers,
      sessionCount: body.sessionCount,
      assignedExaminers: []
    });
    mockTimeSlots.push(created);
    return success(created, 'Time slot created (mock)');
  },

  async updateTimeSlotExaminers(assignmentId, timeSlotId, examinerIds = []) {
    const url = `${base(assignmentId)}/timeslots/${timeSlotId}/examiners`;
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] PUT', url, { examinerIds });
    const resp = await callApiIfEnabled(() => apiClient.put(url, { examinerIds }));

    if (!USE_MOCKS && resp) {
      return success({ updated: examinerIds.length }, 'Examiners updated (api)');
    }

    await delay();
    // Mock: update assigned examiners on mockTimeSlots
    const idx = mockTimeSlots.findIndex(s => s.id === timeSlotId);
    if (idx !== -1) {
      const assignedExaminers = mockExaminers.filter(ex => examinerIds.includes(ex.id)).map(ex => ({ id: ex.id, name: ex.name, email: ex.email }));
      mockTimeSlots[idx] = withStatus({ ...mockTimeSlots[idx], assignedExaminers });
    }
    return success({ updated: examinerIds.length }, 'Examiners updated (mock)');
  },

  // 3) Examiner Management
  async getExaminers(assignmentId) {
    const url = `${base(assignmentId)}/examiners`;
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] GET', url);
    const resp = await callApiIfEnabled(() => apiClient.get(url));

    if (!USE_MOCKS && resp) {
      // eslint-disable-next-line no-console
      console.log('[courseAdminTimeslotService] GET examiners response', {
        status: resp?.status,
        data: resp?.data
      });
      const raw = extractData(resp);
      const arr = Array.isArray(raw?.examiners) ? raw.examiners : Array.isArray(raw) ? raw : [];
      const mapped = arr.map(ex => ({
        id: ex.id,
        name: ex.name,
        email: ex.email,
        avatar: ex.avatar || '/api/placeholder/24/24',
        maxSessions: ex.maxSessions || 0,
        assignments: ex.currentAssignments || 0
      }));
      return success(mapped, 'Examiners (api)');
    }

    await delay();
    return success(mockExaminers, 'Examiners (mock)');
  },

  async updateExaminerLimits(assignmentId, limits) {
    const url = `${base(assignmentId)}/examiners/session-limits`;
    const payload = { examinerLimits: limits.map(l => ({ examinerId: l.examinerId || l.id, maxSessions: parseInt(l.maxSessions, 10) })) };
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] PUT', url, payload);
    const resp = await callApiIfEnabled(() => apiClient.put(url, payload));

    if (!USE_MOCKS && resp) {
      // eslint-disable-next-line no-console
      console.log('[courseAdminTimeslotService] PUT examiner limits response', {
        status: resp?.status,
        data: resp?.data
      });
      return success(limits, 'Examiner limits updated (api)');
    }

    await delay();
    limits.forEach((l) => {
      const ex = mockExaminers.find((e) => e.id === (l.examinerId || l.id));
      if (ex) ex.maxSessions = parseInt(l.maxSessions, 10);
    });
    return success(limits, 'Examiner limits updated (mock)');
  },

  // 4) Schedule Management
  async getScheduleStatus(assignmentId) {
    const response = await callApiIfEnabled(() => apiClient.get(`${base(assignmentId)}/schedule/status`));
    return response;
  },

  async releaseSchedule(assignmentId, payload = {}) {
    // Expect payload to follow ReleaseScheduleRequestDTO from Swagger
    // { audience: 'examiners' | 'students', notifyStudents?, notifyExaminers?, releaseMessage? }
    const response = await callApiIfEnabled(() => apiClient.post(`${base(assignmentId)}/schedule/release`, payload));
    console.log("response", response);
    
    return response;
  },
};

export default courseAdminTimeslotService;
