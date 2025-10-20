import apiClient from '@/services/apiClient.js';

const base = (subjectId, assignmentId) => `/api/admin/subjects/${subjectId}/assignments/${assignmentId}`;

export const adminResultsService = {
  async listAssignmentSessions(subjectId, assignmentId, { pageNum = 1, pageSize = 10, q } = {}) {
    const params = {
      pageNum,
      pageSize,
      q,
    };

    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/sessions`, { params });
    return resp.data;
  },

  async listSessionParticipants(
    subjectId,
    assignmentId,
    sessionId,
    { pageNum = 1, pageSize = 20, status, type, q } = {}
  ) {
    const params = {
      pageNum,
      pageSize,
      status,
      type,
      q,
    };

    const resp = await apiClient.get(
      `${base(subjectId, assignmentId)}/sessions/${sessionId}/participants`,
      { params }
    );
    return resp.data;
  },

  async getGroupResultDetail(subjectId, assignmentId, groupId) {
    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/group/${groupId}`);
    return resp.data;
  },

  async getIndividualResultDetail(subjectId, assignmentId, studentId) {
    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/individual/${studentId}`);
    return resp.data;
  },
};

export default adminResultsService;
