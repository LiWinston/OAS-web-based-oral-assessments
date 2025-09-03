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
    await callApiIfEnabled(() => apiClient.get(`${base(assignmentId)}/calendar`, { params: { month } }));

    await delay();
    // Produce calendar summary keyed by YYYY-MM-DD with { slotCount, status, totalSessions }
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
          slotCount: daySlots.length,
          status: overall,
          totalSessions: daySlots.reduce((sum, s) => sum + (s.sessionCount || 0), 0),
        };
      }
      date.setDate(date.getDate() + 1);
    }
    return { success: true, data: calendarData, message: 'Calendar (mock)' };
  },

  // 2) Time Slot Management
  async createTimeSlotsBatch(assignmentId, { timeSlots }) {
    console.log(timeSlots)
    
    // Prepare request body for real API shape
    const fallbackVenueId = process.env.NEXT_PUBLIC_TEST_VENUE_ID
      ? Number(process.env.NEXT_PUBLIC_TEST_VENUE_ID)
      : undefined;

    const requestSlots = (timeSlots || []).map((slot) => {
      const end24 = slot.endTime && slot.endTime.includes(' ')
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
        startTime: slot.startTime,
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
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] GET', url, { params: filters });
    const resp = await callApiIfEnabled(() => apiClient.get(url, { params: filters }));

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
    return success(res.map(withStatus), 'Time slots (mock)');
  },

  async updateTimeSlot(assignmentId, timeSlotId, body) {
    const url = `${base(assignmentId)}/timeslots/${timeSlotId}`;
    // eslint-disable-next-line no-console
    console.log('[courseAdminTimeslotService] PUT', url, { body });
    const req = {
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      sessionCount: body.sessionCount,
      venueId: body.venueId
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

  // 3) Examiner Management
  async getExaminers(assignmentId) {
    await callApiIfEnabled(() => apiClient.get(`${base(assignmentId)}/examiners`));
    await delay();
    return { success: true, data: mockExaminers, message: 'Examiners (mock)' };
  },

  async updateExaminerLimits(assignmentId, limits) {
    // API expects { examinerLimits: [...] }
    await callApiIfEnabled(() => apiClient.put(`${base(assignmentId)}/examiners/session-limits`, { examinerLimits: limits }));

    await delay();
    limits.forEach((l) => {
      const ex = mockExaminers.find((e) => e.id === (l.examinerId || l.id));
      if (ex) ex.maxSessions = parseInt(l.maxSessions, 10);
    });
    return { success: true, data: limits, message: 'Examiner limits updated (mock)' };
  },

  // 4) Schedule Management
  async getScheduleStatus(assignmentId) {
    await callApiIfEnabled(() => apiClient.get(`${base(assignmentId)}/schedule/status`));

    await delay();
    const totalSlots = mockTimeSlots.length;
    const fullyStaffedSlots = mockTimeSlots.filter((s) => s.status === 'full').length;
    const partiallyStaffedSlots = mockTimeSlots.filter((s) => s.status === 'partial').length;
    const unstaffedSlots = mockTimeSlots.filter((s) => s.status === 'empty').length;
    const canRelease = unstaffedSlots === 0; // simple mock rule
    return {
      success: true,
      data: { totalSlots, fullyStaffedSlots, partiallyStaffedSlots, unstaffedSlots, canRelease, issues: canRelease ? [] : ['Some time slots are not fully staffed'] },
      message: 'Schedule status (mock)',
    };
  },

  async releaseSchedule(assignmentId, payload = {}) {
    await callApiIfEnabled(() => apiClient.post(`${base(assignmentId)}/schedule/release`, payload));

    await delay();
    // validate using current mock view
    const status = await this.getScheduleStatus(assignmentId);
    if (!status.data.canRelease) {
      return { success: true, data: { releasedAt: null, notifiedStudents: 0, totalTimeSlots: mockTimeSlots.length }, message: 'Schedule not released (mock): validation failed' };
    }
    return {
      success: true,
      data: { releasedAt: new Date().toISOString(), notifiedStudents: 25, totalTimeSlots: mockTimeSlots.length },
      message: 'Schedule released (mock)',
    };
  },
};

export default courseAdminTimeslotService;
