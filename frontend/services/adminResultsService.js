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

  async listAssessments(
    subjectId,
    assignmentId,
    {
      pageNum = 1,
      pageSize = 50,
      releaseStatus,
      progress,
      sessionId,
      q,
      includeAll = false,
    } = {}
  ) {
    const params = {
      pageNum,
      pageSize,
      releaseStatus,
      progress,
      sessionId,
      q,
      includeAll,
    };

    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value === undefined || value === null || value === '') {
        delete params[key];
      }
    });

    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/assessments`, { params });
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

  async releaseGroup(subjectId, assignmentId, groupId, payload = {}) {
    const resp = await apiClient.post(
      `${base(subjectId, assignmentId)}/group/${groupId}/release`,
      payload
    );
    return resp.data;
  },

  async releaseIndividual(subjectId, assignmentId, studentId, payload = {}) {
    const resp = await apiClient.post(
      `${base(subjectId, assignmentId)}/individual/${studentId}/release`,
      payload
    );
    return resp.data;
  },

  async reviewExaminerSubmission(subjectId, assignmentId, submissionId, examinerId, payload) {
    const resp = await apiClient.post(
      `${base(subjectId, assignmentId)}/assessments/${submissionId}/examiners/${examinerId}/review`,
      payload
    );
    return resp.data;
  },
};

export default adminResultsService;
