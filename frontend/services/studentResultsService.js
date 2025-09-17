import api from './apiClient';

// Simple in-memory caches for conditional GET support
const lastModifiedCache = new Map(); // key -> Last-Modified
const responseBodyCache = new Map(); // key -> last successful wrapped response

const buildConfigWithIMS = (key, extra = {}) => {
  const headers = { ...(extra.headers || {}) };
  const lm = lastModifiedCache.get(key);
  if (lm) headers['If-Modified-Since'] = lm;
  return { ...extra, headers };
};

const updateLastModifiedAndCache = (key, axiosResponse) => {
  const lm = axiosResponse?.headers?.['last-modified'] || axiosResponse?.headers?.['Last-Modified'];
  if (lm) lastModifiedCache.set(key, lm);
  if (axiosResponse?.data) responseBodyCache.set(key, axiosResponse.data);
};

// Real API service implementation
const realStudentResultsService = {
  async getStudentResults(studentId, options = {}) {
    try {
      const {
        status = 'released',
        semester = 'all',
        pageNum = 0,
        pageSize = 20,
        sort = 'date_desc'
      } = options;
      
      const params = new URLSearchParams({
        status,
        semester,
        pageNum: pageNum.toString(),
        pageSize: pageSize.toString(),
        sort
      });
      
      const key = `GET:/api/students/${studentId}/results?${params.toString()}`;
      const config = buildConfigWithIMS(key);
      const response = await api.get(`/api/students/${studentId}/results?${params}`, config);
      if (response.status === 304) {
        const cached = responseBodyCache.get(key);
        if (cached) return cached;
      }
      updateLastModifiedAndCache(key, response);
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  async getAssignmentResult(studentId, assignmentId) {
    try {
      const key = `GET:/api/students/${studentId}/assignments/${assignmentId}/result`;
      const config = buildConfigWithIMS(key);
      const response = await api.get(`/api/students/${studentId}/assignments/${assignmentId}/result`, config);
      if (response.status === 304) {
        const cached = responseBodyCache.get(key);
        if (cached) return cached;
      }
      updateLastModifiedAndCache(key, response);
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  async getRubricBreakdown(studentId, assignmentId) {
    try {
      const key = `GET:/api/students/${studentId}/assignments/${assignmentId}/result/rubric`;
      const config = buildConfigWithIMS(key);
      const response = await api.get(`/api/students/${studentId}/assignments/${assignmentId}/result/rubric`, config);
      if (response.status === 304) {
        const cached = responseBodyCache.get(key);
        if (cached) return cached;
      }
      updateLastModifiedAndCache(key, response);
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  async getExaminerFeedback(studentId, assignmentId) {
    try {
      const key = `GET:/api/students/${studentId}/assignments/${assignmentId}/result/feedback`;
      const config = buildConfigWithIMS(key);
      const response = await api.get(`/api/students/${studentId}/assignments/${assignmentId}/result/feedback`, config);
      if (response.status === 304) {
        const cached = responseBodyCache.get(key);
        if (cached) return cached;
      }
      updateLastModifiedAndCache(key, response);
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  // Attempt to fetch rubric scale from backend; if unavailable, derive from rubric breakdown
  async getAssignmentRubricScale(studentId, assignmentId) {
    try {
      // Try dedicated rubric scale endpoint first (per API contract 3b)
      const key = `GET:/api/students/${studentId}/assignments/${assignmentId}/result/rubric/scale`;
      const config = buildConfigWithIMS(key);
      const response = await api.get(`/api/students/${studentId}/assignments/${assignmentId}/result/rubric/scale`, config);
      if (response.status === 304) {
        const cached = responseBodyCache.get(key);
        if (cached) return cached;
      }
      updateLastModifiedAndCache(key, response);
      return response.data;
    } catch (e) {
      // Fallback: derive from rubric breakdown
      const rb = await realStudentResultsService.getRubricBreakdown(studentId, assignmentId);
      const criteria = rb?.data?.rubricBreakdown?.criteria || [];
      const defaultLevelsForMax = (max) => {
        const pct = (n) => Math.round((n / 100) * (max || 100));
        return [
          { id: 'lvl-outstanding', label: 'Outstanding', description: '90–100%', minPoints: pct(90), maxPoints: max || 100 },
          { id: 'lvl-very-good', label: 'Very Good', description: '80–89%', minPoints: pct(80), maxPoints: pct(89) },
          { id: 'lvl-good', label: 'Good', description: '70–79%', minPoints: pct(70), maxPoints: pct(79) },
          { id: 'lvl-satisfactory', label: 'Satisfactory', description: '60–69%', minPoints: pct(60), maxPoints: pct(69) },
          { id: 'lvl-needs-improvement', label: 'Needs Improvement', description: '0–59%', minPoints: 0, maxPoints: pct(59) },
        ];
      };
      return {
        success: true,
        code: 'OK',
        data: {
          criteria: criteria.map((c) => ({
            criterionId: c.criterionId,
            levels: defaultLevelsForMax(c.maxPoints),
          })),
        },
      };
    }
  },
};

// Always export real API service (mock removed)
export const studentResultsService = realStudentResultsService;
