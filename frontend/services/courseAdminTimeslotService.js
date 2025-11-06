import apiClient from "./apiClient";
import { to24Hour } from "@/lib/timeMath.js";

const basePath = (assignmentId) => `/api/admin/assignments/${assignmentId}`;

const determineStatus = (assigned, required) => {
  if (assigned === 0) return "empty";
  if (assigned < required) return "partial";
  return "full";
};

const normalizeTimeSlot = (slot = {}) => {
  const assigned = Array.isArray(slot.assignedExaminers)
    ? slot.assignedExaminers
    : [];
  const required =
    slot.requiredExaminers ??
    slot.examinersPerSession ??
    slot.coverage?.required ??
    0;

  return {
    id: slot.id,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    venue: slot.venueName ?? slot.venue?.name ?? "",
    venueId: slot.venueId ?? slot.venue?.id ?? null,
    requiredExaminers: required,
    sessionCount: slot.sessionCount ?? slot.sessions ?? 0,
    assignedExaminers: assigned,
    status: slot.status ?? determineStatus(assigned.length, required),
  };
};

const extractTimeSlotArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.timeSlots)) return payload.timeSlots;
  if (Array.isArray(payload.data?.timeSlots)) return payload.data.timeSlots;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const wrapResult = (body, data) => ({
  success: body?.success !== false,
  code: body?.code,
  message: body?.message,
  data,
});

const ensure24Hour = (value) => {
  if (!value) return value;
  const str = String(value);
  return str.includes(" ") ? to24Hour(str) : str;
};

const buildTimeSlotPayload = (slot = {}) => {
  let venueId = slot.venueId;
  if (venueId == null) {
    const parsed = Number(slot.venue);
    if (!Number.isNaN(parsed)) venueId = parsed;
  }
  return {
    date: slot.date,
    startTime: ensure24Hour(slot.startTime),
    endTime: ensure24Hour(slot.endTime),
    sessionCount: slot.sessionCount,
    requiredExaminers: slot.requiredExaminers,
    venueId,
    assignExaminerIds:
      slot.assignExaminerIds ??
      slot.assignedExaminerIds ??
      slot.assignedExaminers?.map((ex) => ex.id),
  };
};

export const courseAdminTimeslotService = {
  async getSessionConfig(assignmentId) {
    const response = await apiClient.get(
      `${basePath(assignmentId)}/session-config`
    );
    return wrapResult(response.data, response.data?.data);
  },

  async saveSessionConfig(assignmentId, body) {
    const response = await apiClient.put(
      `${basePath(assignmentId)}/session-config`,
      body
    );
    return wrapResult(response.data, response.data?.data);
  },

  async deleteSessionConfig(assignmentId) {
    const response = await apiClient.delete(
      `${basePath(assignmentId)}/session-config`
    );
    return wrapResult(response.data, response.data?.data);
  },

  async getCalendar(assignmentId, month) {
    const response = await apiClient.get(`${basePath(assignmentId)}/calendar`, {
      params: { month },
    });
    return wrapResult(response.data, response.data?.data ?? {});
  },

  async createTimeSlotsBatch(assignmentId, { timeSlots = [] } = {}) {
    const payload = {
      timeSlots: timeSlots.map(buildTimeSlotPayload),
    };
    const response = await apiClient.post(
      `${basePath(assignmentId)}/timeslots/batch`,
      payload
    );
    const slots = extractTimeSlotArray(response.data?.data).map(
      normalizeTimeSlot
    );
    return wrapResult(response.data, slots);
  },

  async createSingleTimeSlot(assignmentId, slot) {
    const response = await apiClient.post(
      `${basePath(assignmentId)}/timeslots/create`,
      buildTimeSlotPayload(slot)
    );
    const payload = response.data?.data ?? response.data;
    return wrapResult(
      response.data,
      normalizeTimeSlot(payload?.timeSlot ?? payload)
    );
  },

  async getTimeSlots(assignmentId, filters = {}) {
    const payload = {};
    if (filters.status) payload.status = filters.status;
    if (filters.date) {
      payload.dateFrom = filters.date;
      payload.dateTo = filters.date;
    } else {
      if (filters.dateFrom) payload.dateFrom = filters.dateFrom;
      if (filters.dateTo) payload.dateTo = filters.dateTo;
    }

    const response = await apiClient.post(
      `${basePath(assignmentId)}/timeslots`,
      payload
    );
    const slots = extractTimeSlotArray(response.data?.data).map(
      normalizeTimeSlot
    );
    return wrapResult(response.data, slots);
  },

  async updateTimeSlot(assignmentId, timeSlotId, body) {
    const payload = buildTimeSlotPayload(body);
    const response = await apiClient.put(
      `${basePath(assignmentId)}/timeslots/${timeSlotId}`,
      payload
    );
    const slot = response.data?.data?.timeSlot ?? response.data?.data;
    return wrapResult(response.data, normalizeTimeSlot(slot));
  },

  async deleteTimeSlots(assignmentId, ids = []) {
    const response = await apiClient.delete(
      `${basePath(assignmentId)}/timeslots`,
      {
        data: { timeSlotIds: ids },
      }
    );
    const deletedIds = response.data?.data ?? [];
    return wrapResult(response.data, {
      deletedIds,
      deletedCount: Array.isArray(deletedIds) ? deletedIds.length : 0,
    });
  },

  async duplicateTimeSlot(assignmentId, timeSlotId, body = {}) {
    const response = await apiClient.post(
      `${basePath(assignmentId)}/timeslots/${timeSlotId}/duplicate`,
      buildTimeSlotPayload(body)
    );
    const slot = response.data?.data?.timeSlot ?? response.data?.data;
    return wrapResult(response.data, normalizeTimeSlot(slot));
  },

  async assignExaminers(assignmentId, timeSlotId, examinerIds = []) {
    const response = await apiClient.post(
      `${basePath(assignmentId)}/timeslots/${timeSlotId}/examiners`,
      { examinerIds }
    );
    const slot = response.data?.data?.timeSlot ?? response.data?.data;
    return wrapResult(response.data, normalizeTimeSlot(slot));
  },

  async updateExaminerLimits(assignmentId, limits = []) {
    let payload;
    if (Array.isArray(limits)) {
      payload = { examinerLimits: limits };
    } else if (Array.isArray(limits?.examinerLimits)) {
      payload = { examinerLimits: limits.examinerLimits };
    } else if (limits) {
      payload = { examinerLimits: [limits] };
    } else {
      payload = { examinerLimits: [] };
    }

    const response = await apiClient.put(
      `${basePath(assignmentId)}/examiners/session-limits`,
      payload
    );
    return wrapResult(response.data, response.data?.data);
  },

  async getExaminers(assignmentId, params = {}) {
    const response = await apiClient.get(
      `${basePath(assignmentId)}/examiners`,
      { params }
    );
    const data = response.data?.data;
    const list = Array.isArray(data?.examiners)
      ? data.examiners
      : Array.isArray(data)
      ? data
      : [];
    return wrapResult(response.data, list);
  },

  async getScheduleStatus(assignmentId) {
    const response = await apiClient.get(
      `${basePath(assignmentId)}/schedule/status`
    );
    return wrapResult(response.data, response.data?.data);
  },

  async releaseSchedule(assignmentId, payload = {}) {
    const response = await apiClient.post(
      `${basePath(assignmentId)}/schedule/release`,
      payload
    );
    return wrapResult(response.data, response.data?.data);
  },
};

export default courseAdminTimeslotService;
