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
    const outsideAssignmentRange = Boolean(
      payload?.outsideAssignmentRange ?? resp?.data?.outsideAssignmentRange
    );
    const summary = payload?.summary ?? resp?.data?.summary ?? resp?.data?.data?.summary ?? null;
    const list = Array.isArray(payload?.sessions)
      ? payload.sessions
      : Array.isArray(payload)
        ? payload
        : [];
    const toTimeString = (t) => {
      if (!t) return t;
      if (typeof t === 'string') return t.slice(0, 5);
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
    return { success: true, data: sessions, summary, outsideAssignmentRange };
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
    const raw = resp?.data ?? {};
    const createdRaw = payload?.sessions || payload || [];
    const toHhMm = (t) => (typeof t === 'string' ? t.slice(0, 5) : t);
    const created = Array.isArray(createdRaw)
      ? createdRaw.map((s) => ({ ...s, startTime: toHhMm(s.startTime), endTime: toHhMm(s.endTime) }))
      : [];
    const message = raw.message || (typeof raw.data === 'string' ? raw.data : undefined);
    return { success: Boolean(raw.success ?? true), code: raw.code, message, data: created };
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
    const raw = resp?.data ?? {};
    const toHhMm = (t) => (typeof t === 'string' ? t.slice(0, 5) : t);
    const generatedRaw = payload?.sessions || payload || [];
    const generated = Array.isArray(generatedRaw)
      ? generatedRaw.map((s) => ({ ...s, startTime: toHhMm(s.startTime), endTime: toHhMm(s.endTime) }))
      : [];
    const message = raw.message || (typeof raw.data === 'string' ? raw.data : undefined);
    return { success: Boolean(raw.success ?? true), code: raw.code, message, data: generated };
  },

  async deleteSessions(assignmentId, sessionIds = []) {
    const resp = await apiClient.delete(`${sessionsBase(assignmentId)}/sessions`, { data: { sessionIds } });
    const raw = resp?.data ?? {};
    const message = raw.message || (typeof raw.data === 'string' ? raw.data : undefined);
    return { success: Boolean(raw.success ?? true), code: raw.code, message, data: extract(resp) };
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
    const d = resp?.data ?? {};
    const message = d.message ?? (typeof d.data === 'string' ? d.data : undefined);
    return { success: Boolean(d.success ?? true), code: d.code, message, data: extract(resp) };
  },
  async unassignSessionExaminer(sessionId, examinerId) {
    const resp = await apiClient.delete(`/api/admin/sessions/${sessionId}/examiners/${examinerId}`);
    const d = resp?.data ?? {};
    const message = d.message ?? (typeof d.data === 'string' ? d.data : undefined);
    return { success: Boolean(d.success ?? true), code: d.code, message, data: extract(resp) };
  },
  async getSessionExaminerIds(sessionId) {
    const resp = await apiClient.get(`/api/admin/sessions/${sessionId}/examiners`);
    const payload = extract(resp);
    return { success: true, data: Array.isArray(payload) ? payload : [] };
  },

  // Assignment-level publish status
  async getAssignmentPublishStatus(assignmentId) {
    const resp = await apiClient.get(`/api/admin/sessions/assignments/${assignmentId}/publish/status`);
    const data = extract(resp) || {};
    const exam = Boolean(
      data.publishedToExaminer ?? data.publishedToExaminers ?? data.examiner ?? data.examiners
    );
    const stu = Boolean(
      data.publishedToStudent ?? data.publishedToStudents ?? data.student ?? data.students
    );
    return { success: true, data: { examiners: exam, students: stu } };
  },

  async setAssignmentPublishToStudents(assignmentId, value) {
    const resp = await apiClient.put(
      `/api/admin/sessions/assignments/${assignmentId}/publish/student`,
      null,
      { params: { value: Boolean(value) } }
    );
    const d = resp?.data ?? {};
    const message = d.message ?? (typeof d.data === 'string' ? d.data : undefined);
    return { success: Boolean(d.success ?? true), code: d.code, message, data: d.data };
  },

  async setAssignmentPublishToExaminers(assignmentId, value) {
    const resp = await apiClient.put(
      `/api/admin/sessions/assignments/${assignmentId}/publish/examiner`,
      null,
      { params: { value: Boolean(value) } }
    );
    const d = resp?.data ?? {};
    const message = d.message ?? (typeof d.data === 'string' ? d.data : undefined);
    return { success: Boolean(d.success ?? true), code: d.code, message, data: d.data };
  },

  async updateSession(assignmentId, sessionId, body) {
    const request = {
      date: body?.date,
      startTime: toTimeString(body?.startTime),
      endTime: toTimeString(body?.endTime),
      venueId: body?.venueId,
      requiredExaminers: body?.requiredExaminers != null ? Number(body.requiredExaminers) : undefined,
      capacity: body?.capacity != null ? Number(body.capacity) : undefined,
    };
    const resp = await apiClient.put(`${sessionsBase(assignmentId)}/sessions/${sessionId}`, request);
    const payload = extract(resp);
    const raw = resp?.data ?? {};
    const updated = payload?.session || payload || null;
    const toHhMm = (t) => (typeof t === 'string' ? t.slice(0, 5) : t);
    const message = raw.message || (typeof raw.data === 'string' ? raw.data : undefined);
    return { success: Boolean(raw.success ?? true), code: raw.code, message, data: updated ? { ...updated, startTime: toHhMm(updated.startTime), endTime: toHhMm(updated.endTime) } : null };
  },

  // Publish / Visibility controls per session
  async getSessionPublishStatus(sessionId) {
    const resp = await apiClient.get(`/api/admin/sessions/sessions/${sessionId}/publish/status`);
    // Expect shape like { examiner: boolean, student: boolean } or similar; normalize conservatively
    const data = extract(resp) || {};
    const exam = Boolean(
      data.examiners ??
      data.examiner ??
      data.toExaminers ??
      data.publishedToExaminers ??
      data.publishedToExaminer ??
      data.examinersPublished
    );
    const stu = Boolean(
      data.students ??
      data.student ??
      data.toStudents ??
      data.publishedToStudents ??
      data.publishedToStudent ??
      data.studentsPublished
    );
    return { success: true, data: { examiners: exam, students: stu } };
  },
  async setSessionPublishToStudents(sessionId, value) {
    const resp = await apiClient.put(`/api/admin/sessions/sessions/${sessionId}/publish/student`, null, { params: { value: Boolean(value) } });
    const d = resp?.data ?? {};
    const message = d.message ?? (typeof d.data === 'string' ? d.data : undefined);
    return { success: Boolean(d.success ?? true), code: d.code, message, data: extract(resp) };
  },
  async setSessionPublishToExaminers(sessionId, value) {
    const resp = await apiClient.put(`/api/admin/sessions/sessions/${sessionId}/publish/examiner`, null, { params: { value: Boolean(value) } });
    const d = resp?.data ?? {};
    const message = d.message ?? (typeof d.data === 'string' ? d.data : undefined);
    return { success: Boolean(d.success ?? true), code: d.code, message, data: extract(resp) };
  },

  // Sessions calendar (assignment-level, month in YYYY-MM)
  // Accept optional extra params (e.g., { venueId }) for backend-filtered aggregates
  async getSessionsCalendar(assignmentId, month, extraParams = {}) {
    const params = { month, ...extraParams };
    const resp = await apiClient.get(`/api/admin/sessions/assignments/${assignmentId}/calendar`, { params });
    const raw = extract(resp) || {};
    // Accept either { dates: {...} } or direct map { 'YYYY-MM-DD': {...} }
    const dates = raw.dates || raw || {};
    const map = {};
    for (const [date, v] of Object.entries(dates)) {
      const fully = Number(v.fullyStaffed ?? v.fully ?? v.full ?? 0) || 0;
      const partial = Number(v.partialStaffed ?? v.partiallyStaffed ?? v.partial ?? 0) || 0;
      const none = Number(v.noStaffed ?? v.unstaffed ?? v.none ?? 0) || 0;
      map[date] = { fullyStaffed: fully, partialStaffed: partial, noStaffed: none };
    }
    return { success: true, data: map };
  },
};

export default courseAdminSessionService;
