import api from "./apiClient";

// Simple in-memory caches for conditional GET support
const lastModifiedCache = new Map(); // key -> Last-Modified
const responseBodyCache = new Map(); // key -> last successful wrapped response

const buildConfigWithIMS = (key, extra = {}) => {
  const headers = { ...(extra.headers || {}) };
  const lm = lastModifiedCache.get(key);
  if (lm) headers["If-Modified-Since"] = lm;
  return { ...extra, headers };
};

const updateLastModifiedAndCache = (key, axiosResponse) => {
  const lm =
    axiosResponse?.headers?.["last-modified"] ||
    axiosResponse?.headers?.["Last-Modified"];
  if (lm) lastModifiedCache.set(key, lm);
  if (axiosResponse?.data) responseBodyCache.set(key, axiosResponse.data);
};

export const studentResultsService = {
  async getStudentResults(studentId, options = {}) {
    const {
      status = "released",
      semester = "all",
      pageNum = 0,
      pageSize = 20,
      sort = "date_desc",
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
    const response = await api.get(
      `/api/students/${studentId}/results?${params}`,
      config
    );
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
    const response = await api.get(
      `/api/students/${studentId}/assignments/${assignmentId}/result`,
      config
    );
    if (response.status === 304) {
      const cached = responseBodyCache.get(key);
      if (cached) return cached;
    }
    updateLastModifiedAndCache(key, response);
    return response.data;
  },
};

export default studentResultsService;
