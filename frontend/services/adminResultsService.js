import apiClient from '@/services/apiClient.js';

const base = (subjectId, assignmentId) => `/api/admin/subjects/${subjectId}/assignments/${assignmentId}`;

const mapReleaseFilter = (status) => {
  if (status === 'released') return true;
  if (status === 'not_released') return false;
  return undefined;
};

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

  async listAssessments(subjectId, assignmentId, { pageNum = 1, pageSize = 20, q, sessionId, status } = {}) {
    const isReleased = mapReleaseFilter(status);
    const params = {
      pageNum,
      pageSize,
      q,
      sessionId,
      ...(typeof isReleased === 'boolean' ? { isReleased } : {}),
    };

    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/assessments`, { params });
    return resp.data;
  },

  async getAssessmentDetail(subjectId, assignmentId, submissionId) {
    const resp = await apiClient.get(`${base(subjectId, assignmentId)}/assessments/${submissionId}`);
    return resp.data;
  },

  async reviewExaminer(subjectId, assignmentId, submissionId, examinerId, body) {
    const resp = await apiClient.post(`${base(subjectId, assignmentId)}/assessments/${submissionId}/examiners/${examinerId}/review`, body);
    return resp.data;
  },

  async releaseAssessment(subjectId, assignmentId, submissionId, body = {}) {
    const resp = await apiClient.post(`${base(subjectId, assignmentId)}/assessments/${submissionId}/release`, body);
    return resp.data;
  },
};

export default adminResultsService;
