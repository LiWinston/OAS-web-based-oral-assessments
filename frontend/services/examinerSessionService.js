import apiClient from './apiClient';

/**
 * Examiner Session Service
 * Handles assignment and session-related operations for examiners
 */
const examinerSessionService = {
  /**
   * Get all assignments available to examiner
   * POST /api/examiners/assignments/list
   * 
   * @param {number} examinerId - The examiner ID
   * @returns {Promise} API response with assignments list
   */
  async getAssignmentsList(examinerId) {
    try {
      const response = await apiClient.post('/api/examiners/assignments/list', {
        examinerId: Number(examinerId)
      });
      
      
      // Check if backend response has success/data structure
      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          code: 'OK',
          data: response.data.data  // Extract the actual assignments array
        };
      } else if (Array.isArray(response.data)) {
        // If response.data is directly an array
        return {
          success: true,
          code: 'OK',
          data: response.data
        };
      } else {
        return {
          success: false,
          code: 'NO_DATA',
          message: 'No assignments data found',
          data: []
        };
      }
    } catch (error) {
      console.error('Error fetching assignments list:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch assignments list',
        error: error.response?.data
      };
    }
  },

  /**
   * Get sessions for a specific assignment
   * POST /api/examiners/{examinerId}/assignments/{assignmentId}/sessions/query
   * 
   * @param {number} examinerId - The examiner ID
   * @param {number} assignmentId - The assignment ID
   * @param {object} filters - Optional filters for sessions
   * @returns {Promise} API response with sessions for the assignment
   */
  async getAssignmentSessions(examinerId, assignmentId, filters = {}) {
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.venueId !== undefined && filters.venueId !== null && filters.venueId !== '') {
        params.venueId = Number(filters.venueId);
      }
      if (filters.status) params.status = filters.status.toString().toUpperCase();

      let response;
      try {
        response = await apiClient.get(
          `/api/admin/sessions/assignments/${assignmentId}/sessions`,
          { params }
        );
      } catch (error) {
        const statusCode = error?.response?.status;

        if (!statusCode || ![404, 405].includes(statusCode)) {
          throw error;
        }

        // Build payload for legacy fallback
        const payload = {};
        if (filters.date) payload.date = filters.date;
        if (filters.venueId !== undefined) payload.venueId = Number(filters.venueId);
        if (filters.status) payload.status = filters.status;

        Object.keys(filters).forEach((key) => {
          if (!['date', 'venueId', 'status'].includes(key) && filters[key] !== undefined) {
            payload[key] = filters[key];
          }
        });

        response = await apiClient.post(
          `/api/examiners/${examinerId}/assignments/${assignmentId}/sessions/query`,
          payload
        );
      }

      // Check if backend response has success/data structure
      if (response.data?.success && response.data?.data) {
        const sessionsPayload = response.data.data;
        const sessionsData = Array.isArray(sessionsPayload)
          ? sessionsPayload
          : Array.isArray(sessionsPayload.sessions)
            ? sessionsPayload.sessions
            : [];

        return {
          success: true,
          code: 'OK',
          data: sessionsData,
          summary: sessionsPayload.summary || null,
          fullyStaffed: sessionsPayload.fullyStaffed ?? null,
          partiallyStaffed: sessionsPayload.partiallyStaffed ?? null,
          unstaffed: sessionsPayload.unstaffed ?? null,
          outsideAssignmentRange: sessionsPayload.outsideAssignmentRange ?? null,
          message: sessionsPayload.message ?? null,
        };
      }

      if (Array.isArray(response.data)) {
        return {
          success: true,
          code: 'OK',
          data: response.data
        };
      }

      return {
        success: false,
        code: 'NO_DATA',
        message: 'No timeslot data found',
        data: []
      };
    } catch (error) {
      console.error('Error fetching assignment timeslots:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch assignment timeslots',
        error: error.response?.data
      };
    }
  },

  /**
   * Get all sessions for examiner (legacy)
   * POST /api/sessions/students
   * 
   * @param {number} sessionId - The session ID to query
   * @returns {Promise} API response with session info
   */
  async getSessionStudents(sessionId) {
    try {
      const response = await apiClient.post('/api/sessions/students', {
        sessionId: Number(sessionId)
      });
      
      return {
        success: true,
        code: 'OK',
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching timeslot students:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch timeslot students',
        error: error.response?.data
      };
    }
  },

  /**
   * Get examiner schedule (assignments and sessions)
   * POST /api/examiners/{examinerId}/schedule
   * 
   * @param {number} examinerId - The examiner ID
   * @param {object} payload - Request payload (e.g., {"assignmentId": 1})
   * @returns {Promise} API response with examiner schedule
   */
  async getExaminerSchedule(examinerId, payload = {}) {
    try {
      const response = await apiClient.post(`/api/examiners/${examinerId}/schedule`, payload);
      
      console.log('📅 Examiner Schedule API response:', response.data);
      
      // Check if backend response has success/data structure
      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          code: 'OK',
          data: response.data.data  // Extract the actual assignments data
        };
      } else if (response.data && typeof response.data === 'object') {
        // If response.data is directly the schedule data
        return {
          success: true,
          code: 'OK',
          data: response.data
        };
      } else {
        return {
          success: false,
          code: 'NO_DATA',
          message: 'No schedule data found',
          data: null
        };
      }
    } catch (error) {
      console.error('Error fetching examiner schedule:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch examiner schedule',
        error: error.response?.data
      };
    }
  },

  /**
   * Get detailed session with assessments
   * POST /api/sessions/students/detailed
   * 
   * @param {number} sessionId - The session ID
   * @param {number} examinerId - The examiner ID
   * @returns {Promise} API response with detailed session and assessments
   */
  async getSessionDetailed(sessionId, examinerId) {
    try {
      const response = await apiClient.post('/api/sessions/students/detailed', {
        sessionId: Number(sessionId),
        examinerId: Number(examinerId)
      });
      
      
      // Check if backend response has success/data structure
      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          code: 'OK',
          data: response.data.data  // Extract the actual session data
        };
      } else if (response.data && typeof response.data === 'object') {
        // If response.data is directly the session data
        return {
          success: true,
          code: 'OK',
          data: response.data
        };
      } else {
        return {
          success: false,
          code: 'NO_DATA',
          message: 'No timeslot data found',
          data: null
        };
      }
    } catch (error) {
      console.error('Error fetching detailed timeslot:', error);
      return {
        success: false,
        code: error.response?.data?.code || 'ERROR',
        message: error.response?.data?.message || 'Failed to fetch detailed timeslot',
        error: error.response?.data
      };
    }
  }
};

export default examinerSessionService;
