import apiClient from '@/services/apiClient.js';

function extract(resp) {
  if (!resp) return null;
  const d = resp.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data;
  return d ?? null;
}

// Sessions endpoints live under /api/admin/sessions/assignments/{assignmentId}
const sessionsBase = (assignmentId) => `/api/admin/sessions/assignments/${assignmentId}`;

// Normalize various time inputs to "HH:mm:ss" strings expected by Swagger
function toTimeString(t) {
  if (!t) return null;
  if (typeof t === 'string') {
    const parts = t.split(':');
    if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    if (parts.length >= 3) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${String(parts[2] || '00').padStart(2, '0')}`;
    return t;
  }
  if (typeof t === 'object' && t != null && 'hour' in t && 'minute' in t) {
    const h = String(t.hour ?? 0).padStart(2, '0');
    const m = String(t.minute ?? 0).padStart(2, '0');
    const s = String(t.second ?? 0).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return null;
}

export const courseAdminSessionService = {
  async getSessions(assignmentId, params = {}) {
    const resp = await apiClient.get(`${sessionsBase(assignmentId)}/sessions`, { params });
    const payload = extract(resp);
    const list = Array.isArray(payload?.sessions)
      ? payload.sessions
      : Array.isArray(payload)
      ? payload
      : [];
    const toTimeString = (t) => {
      if (!t) return t;
      if (typeof t === 'string') return t.slice(0,5);
      if (typeof t === 'object' && t.hour != null && t.minute != null) {
        const h = String(t.hour).padStart(2, '0');
        const m = String(t.minute).padStart(2, '0');
        return `${h}:${m}`;
      }
      return t;
    };
    const sessions = list.map((s) => ({
      ...s,
      startTime: toTimeString(s.startTime),
      endTime: toTimeString(s.endTime),
    }));
    return { success: true, data: sessions };
  },

  async createSessionsBatch(assignmentId, body) {
    // Accept either { windows: [...] } or { sessions: [...] } and normalize to BatchCreateSessionsRequestDTO
    const windows = Array.isArray(body?.windows)
      ? body.windows
      : Array.isArray(body?.sessions)
      ? body.sessions.map((s) => ({
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          sessionCount: s.sessionCount || 1,
          venueId: s.venueId,
          requiredExaminers: s.requiredExaminers,
          capacity: s.capacity,
        }))
      : [];
    const request = {
      windows: windows.map((w) => ({
        date: w.date,
        startTime: toTimeString(w.startTime),
        endTime: toTimeString(w.endTime),
        sessionCount: w.sessionCount != null ? Number(w.sessionCount) : undefined,
        venueId: w.venueId,
        requiredExaminers: w.requiredExaminers != null ? Number(w.requiredExaminers) : undefined,
        capacity: w.capacity != null ? Number(w.capacity) : undefined,
      })),
    };
    const resp = await apiClient.post(`${sessionsBase(assignmentId)}/sessions/batch`, request);
    const payload = extract(resp);
    const createdRaw = payload?.sessions || payload || [];
    const toHhMm = (t) => (typeof t === 'string' ? t.slice(0, 5) : t);
    const created = Array.isArray(createdRaw)
      ? createdRaw.map((s) => ({ ...s, startTime: toHhMm(s.startTime), endTime: toHhMm(s.endTime) }))
      : [];
    return { success: true, data: created };
  },

  async generateSessions(assignmentId, body) {
    const request = {
      date: body?.date,
      startTime: toTimeString(body?.startTime),
      count: body?.count != null ? Number(body.count) : undefined,
      length: body?.length != null ? Number(body.length) : undefined,
      gapTime: body?.gapTime != null ? Number(body.gapTime) : undefined,
      venueId: body?.venueId,
      requiredExaminers: body?.requiredExaminers != null ? Number(body.requiredExaminers) : undefined,
      capacity: body?.capacity != null ? Number(body.capacity) : undefined,
    };
    const resp = await apiClient.post(`${sessionsBase(assignmentId)}/sessions/generate`, request);
    const payload = extract(resp);
    const toHhMm = (t) => (typeof t === 'string' ? t.slice(0, 5) : t);
    const generatedRaw = payload?.sessions || payload || [];
    const generated = Array.isArray(generatedRaw)
      ? generatedRaw.map((s) => ({ ...s, startTime: toHhMm(s.startTime), endTime: toHhMm(s.endTime) }))
      : [];
    return { success: true, data: generated };
  },

  async deleteSessions(assignmentId, sessionIds = []) {
    const resp = await apiClient.delete(`${sessionsBase(assignmentId)}/sessions`, { data: { sessionIds } });
    return { success: true, data: extract(resp) };
  },

  // Examiners — list available within an assignment (session-aware filtering TBD on backend)
  async getAvailableExaminers(assignmentId, params = {}) {
    const resp = await apiClient.get(`/api/admin/assignments/${assignmentId}/examiners`, { params });
    const payload = extract(resp);
    const list = Array.isArray(payload?.examiners) ? payload.examiners : Array.isArray(payload) ? payload : [];
    return { success: true, data: list };
  },

  // Session examiners — single-session helpers
  async assignSessionExaminers(sessionId, examinerIds = []) {
    const resp = await apiClient.post(`/api/admin/sessions/${sessionId}/examiners`, { examinerIds });
    return { success: true, data: extract(resp) };
  },
  async unassignSessionExaminer(sessionId, examinerId) {
    const resp = await apiClient.delete(`/api/admin/sessions/${sessionId}/examiners/${examinerId}`);
    return { success: true, data: extract(resp) };
  },
  async getSessionExaminerIds(sessionId) {
    const resp = await apiClient.get(`/api/admin/sessions/${sessionId}/examiners`);
    const payload = extract(resp);
    return { success: true, data: Array.isArray(payload) ? payload : [] };
  },
};

export default courseAdminSessionService;
