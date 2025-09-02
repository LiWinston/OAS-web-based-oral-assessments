import apiClient from '@/services/apiClient.js';

/**
 * Unified Course Admin Timeslot Service
 * - Calls real endpoints under `/admin/assignments/{assignmentId}/...`
 * - Always returns mock-shaped data expected by current hooks/mappers
 * - Catches errors and still resolves with { success: true, data, message }
 */

// Toggle: use mocks vs. call real API
// Default to mocks unless explicitly disabled (NEXT_PUBLIC_USE_MOCKS=false)
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

// Helper to optionally call API without triggering axios error logging in dev
// When USE_MOCKS is true, we skip network calls entirely to avoid 404 logs
async function callApiIfEnabled(fn) {
  if (!USE_MOCKS && typeof fn === 'function') {
    try {
      return await fn();
    } catch (e) {
      // swallow errors; service returns mock-shaped data below
    }
  }
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

const base = (assignmentId) => `/admin/assignments/${assignmentId}`;

export const courseAdminTimeslotService = {
  // 1) Session Configuration
  async getSessionConfig(assignmentId) {
    await callApiIfEnabled(() => apiClient.get(`${base(assignmentId)}/session-config`));

    await delay();
    const config = mockSessionConfigs[assignmentId] || {
      assignmentId,
      sessionLength: 30,
      gapTime: 5,
      examinersPerSession: 2,
      isConfigured: false,
    };
    return { success: true, data: config, message: 'Session configuration (mock)' };
  },

  async saveSessionConfig(assignmentId, body) {
    await callApiIfEnabled(() => apiClient.put(`${base(assignmentId)}/session-config`, body));

    await delay();
    mockSessionConfigs[assignmentId] = {
      assignmentId,
      ...body,
      isConfigured: true,
    };
    return { success: true, data: mockSessionConfigs[assignmentId], message: 'Session configuration saved (mock)' };
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
    await callApiIfEnabled(() => apiClient.post(`${base(assignmentId)}/timeslots/batch`, { timeSlots }));

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
      return {
        success: true,
        data: [],
        message: `Conflicts detected (mock): ${conflicts.join(', ')}`,
      };
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
    return { success: true, data: created, message: `${created.length} time slots created (mock)` };
  },

  async getTimeSlots(assignmentId, filters = {}) {
    await callApiIfEnabled(() => apiClient.get(`${base(assignmentId)}/timeslots`, { params: filters }));

    await delay();
    let res = [...mockTimeSlots];
    if (filters.date) res = res.filter((s) => s.date === filters.date);
    if (filters.status) res = res.filter((s) => s.status === filters.status);
    return { success: true, data: res.map(withStatus), message: 'Time slots (mock)' };
  },

  async updateTimeSlot(assignmentId, timeSlotId, body) {
    await callApiIfEnabled(() => apiClient.put(`${base(assignmentId)}/timeslots/${timeSlotId}`, body));

    await delay();
    const idx = mockTimeSlots.findIndex((s) => s.id === timeSlotId);
    if (idx === -1) {
      return { success: true, data: null, message: 'Time slot not found (mock)' };
    }
    const updated = withStatus({ ...mockTimeSlots[idx], ...body });
    mockTimeSlots[idx] = updated;
    return { success: true, data: updated, message: 'Time slot updated (mock)' };
  },

  async deleteTimeSlots(assignmentId, ids) {
    await callApiIfEnabled(() => apiClient.delete(`${base(assignmentId)}/timeslots`, { data: { timeSlotIds: ids } }));

    await delay();
    const before = mockTimeSlots.length;
    mockTimeSlots = mockTimeSlots.filter((s) => !ids.includes(s.id));
    const deleted = before - mockTimeSlots.length;
    return { success: true, data: { deletedCount: deleted }, message: `${deleted} deleted (mock)` };
  },

  async duplicateTimeSlot(assignmentId, timeSlotId, body = {}) {
    await callApiIfEnabled(() => apiClient.post(`${base(assignmentId)}/timeslots/${timeSlotId}/duplicate`, body));

    await delay();
    const orig = mockTimeSlots.find((s) => s.id === timeSlotId);
    if (!orig) return { success: true, data: null, message: 'Original not found (mock)' };

    let newDate = body.date;
    if (!newDate) {
      const d = new Date(`${orig.date}T00:00:00`);
      d.setDate(d.getDate() + 1);
      newDate = d.toISOString().slice(0, 10);
    }
    const dup = withStatus({ ...orig, id: generateId(), date: newDate, assignedExaminers: [] });
    dup.status = 'empty';
    mockTimeSlots.push(dup);
    return { success: true, data: dup, message: 'Time slot duplicated (mock)' };
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
