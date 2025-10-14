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
const USE_MOCK = process.env.NEXT_PUBLIC_USE_STUDENT_RESULTS_MOCK === 'true';
let mockDataPromise = null;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const getMockStudentResults = async () => {
  if (!mockDataPromise) {
    mockDataPromise = import('../mock/studentResults.mock.json').then((module) => module.default || module);
  }
  const mockData = await mockDataPromise;
  if (!mockData || typeof mockData !== 'object') {
    throw new Error('Mock student results data unavailable.');
  }
  return mockData;
};

const mockStudentResultsService = {
  async getStudentResults() {
    const mock = await getMockStudentResults();
    return deepClone(mock.overview);
  },

  async getAssignmentResult(_, assignmentId) {
    const mock = await getMockStudentResults();
    const detail = mock.details?.[String(assignmentId)];
    if (!detail) {
      throw new Error(`No mock result found for assignment ${assignmentId}`);
    }
    return deepClone(detail);
  },
};

const realStudentResultsService = {
  async getStudentResults(studentId, options = {}) {
    const {
      status = 'released',
      semester = 'all',
      pageNum = 0,
      pageSize = 20,
      sort = 'date_desc',
    } = options;

    const params = new URLSearchParams({
      status,
      semester,
      pageNum: pageNum.toString(),
      pageSize: pageSize.toString(),
      sort,
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
  },

  async getAssignmentResult(studentId, assignmentId) {
    const key = `GET:/api/students/${studentId}/assignments/${assignmentId}/result`;
    const config = buildConfigWithIMS(key);
    const response = await api.get(`/api/students/${studentId}/assignments/${assignmentId}/result`, config);
    if (response.status === 304) {
      const cached = responseBodyCache.get(key);
      if (cached) return cached;
    }
    updateLastModifiedAndCache(key, response);
    return response.data;
  },
};

export const studentResultsService = USE_MOCK ? mockStudentResultsService : realStudentResultsService;
