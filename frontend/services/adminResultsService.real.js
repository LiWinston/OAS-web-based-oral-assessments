import apiClient from "./apiClient";

// Real implementation calling backend API. Returns server envelope unchanged.
const baseURL = "/api/admin";

const adminResultsServiceReal = {
  async getConsolidatedResults(assignmentId, params = {}) {
    const response = await apiClient.get(
      `${baseURL}/assignments/${assignmentId}/marks/consolidated`,
      { params }
    );
    return response.data;
  },

  async getEntityDetail(assignmentId, sessionId, kind, entityId) {
    const response = await apiClient.get(
      `${baseURL}/assignments/${assignmentId}/sessions/${sessionId}/entities/${kind}/${entityId}`
    );
    return response.data;
  },

  async getAggregationMethod(assignmentId) {
    const response = await apiClient.get(
      `${baseURL}/assignments/${assignmentId}/marks/aggregation`
    );
    return response.data;
  },

  async setAggregationMethod(assignmentId, method) {
    const response = await apiClient.patch(
      `${baseURL}/assignments/${assignmentId}/marks/aggregation`,
      { method }
    );
    return response.data;
  },

  async releaseResults(assignmentId, body) {
    const payload = {
      scope: body?.scope ?? "SELECTION",
      entities: body?.entities ?? [],
      notify: !!body?.notify,
    };
    const response = await apiClient.post(
      `${baseURL}/assignments/${assignmentId}/results/release`,
      payload
    );
    return response.data;
  },

  async withdrawResults(assignmentId, body) {
    const payload = {
      scope: body?.scope ?? "SELECTION",
      entities: body?.entities ?? [],
      reason: body?.reason ?? "",
    };
    const response = await apiClient.post(
      `${baseURL}/assignments/${assignmentId}/results/withdraw`,
      payload
    );
    return response.data;
  },

  async getPublicationSchedule(assignmentId) {
    const response = await apiClient.get(
      `${baseURL}/assignments/${assignmentId}/results/publication`
    );
    return response.data;
  },

  async setPublicationSchedule(assignmentId, schedule) {
    const payload = {
      status: schedule?.status,
      at: schedule?.at,
      notify: !!schedule?.notify,
    };
    const response = await apiClient.put(
      `${baseURL}/assignments/${assignmentId}/results/publication`,
      payload
    );
    return response.data;
  },

  async setOverride(assignmentId, sessionId, kind, entityId, body) {
    const payload = {
      finalOverridePct1dp: body?.finalOverridePct1dp,
      reason: body?.reason,
    };
    const response = await apiClient.patch(
      `${baseURL}/assignments/${assignmentId}/sessions/${sessionId}/entities/${kind}/${entityId}/override`,
      payload
    );
    return response.data;
  },

  async clearOverride(assignmentId, sessionId, kind, entityId) {
    const response = await apiClient.delete(
      `${baseURL}/assignments/${assignmentId}/sessions/${sessionId}/entities/${kind}/${entityId}/override`
    );
    return response.data;
  },

  // Optional: Review endpoint as per API contracts
  async reviewEntity(assignmentId, sessionId, kind, entityId, request) {
    const response = await apiClient.post(
      `${baseURL}/assignments/${assignmentId}/sessions/${sessionId}/entities/${kind}/${entityId}:review`,
      request
    );
    return response.data;
  },
};

export default adminResultsServiceReal;

