/**
 * Student Groups Service
 * 
 * Service layer for student groups-related API calls following the API contracts.
 * Implements the endpoints specified in Student-Groups-API-Contracts(Final).md.
 */

import apiClient, { api } from './apiClient';
import useAuthStore from '../store/authStore';

// Note: do not hardcode a fallback student id; always read from auth store

/**
 * Student Groups Service Class
 * Implements the API contracts defined in Student-Groups-API-Contracts(Final).md
 */
class StudentGroupsService {
  constructor() {
    // simple in-memory Last-Modified cache keyed by request signature
    this.lastModifiedCache = new Map();
    // cache last successful wrapped responses keyed by request signature
    this.responseBodyCache = new Map();
  }

  // Internal: build config with conditional GET headers
  buildConfigWithIMS(key, extra = {}) {
    const headers = { ...(extra.headers || {}) };
    const last = this.lastModifiedCache.get(key);

    // Only attach If-Modified-Since for same-origin requests to avoid CORS preflight failing when the header is not allowed
    let allowIMS = true;
    try {
      if (typeof window !== 'undefined') {
        const baseURL = apiClient.defaults.baseURL;
        if (baseURL && /^https?:/i.test(baseURL)) {
          const apiOrigin = new URL(baseURL).origin;
          allowIMS = apiOrigin === window.location.origin;
        }
      }
    } catch (_e) { /* noop */ }

    if (last && allowIMS) headers['If-Modified-Since'] = last;
    return { ...extra, headers };
  }

  // Internal: process response and update Last-Modified cache
  handleConditionalResponse(key, response) {
    const lm = response?.headers?.['last-modified'] || response?.headers?.['Last-Modified'];
    if (lm) this.lastModifiedCache.set(key, lm);
  }
  /**
   * List student's active groups (assignment-level)
   * GET /api/students/{studentId}/groups?status=active&pageNum=&pageSize=&sort=semester_desc
   * 
   * @param {number} studentId - The student ID
   * @param {Object} options - Query options
   * @param {string} options.status - Filter status (default: 'active')
   * @param {number} options.pageNum - Page number (default: 0)
   * @param {number} options.pageSize - Page size (default: 20)
   * @param {string} options.sort - Sort order (default: 'semester_desc')
   * @returns {Promise<Object>} API response with groups overview
   */
  async getStudentGroups(studentId, options = {}) {
    try {
      const {
        status = 'active',
        pageNum = 0,
        pageSize = 20,
        sort = 'semester_desc'
      } = options;

      // Real API path
      const key = `GET:/api/students/${studentId}/groups?${status}|${pageNum}|${pageSize}|${sort}`;
      const config = this.buildConfigWithIMS(key, { params: { status, pageNum, pageSize, sort } });
      if (typeof window !== 'undefined') {
        try {
          // eslint-disable-next-line no-console
          console.debug('[studentGroupsService][getStudentGroups] about to request', {
            baseURL: apiClient.defaults.baseURL,
            url: `/api/students/${studentId}/groups`,
            params: config.params,
            ims: config.headers && config.headers['If-Modified-Since'],
            withCredentials: apiClient.defaults.withCredentials,
          });
        } catch (_e) {}
      }
      const response = await api.get(`/api/students/${studentId}/groups`, config);
      if (response.status === 304) {
        // Return last successful REAL response if cached; otherwise fallback to previous behavior
        const cached = this.responseBodyCache.get(key);
        if (cached) return cached;
        return {
          success: true,
          code: 'OK',
          data: {
            pageNum,
            pageSize,
            total: 0,
            data: [],
          },
        };
      }
      this.handleConditionalResponse(key, response);

      const wrapped = response.data;
      if (wrapped?.success === false) {
        const reason = wrapped?.code || 'UNKNOWN_ERROR';
        const msg = wrapped?.message || 'Failed to load groups';
        const err = new Error(msg);
        err.code = reason;
        throw err;
      }
      // cache successful wrapped response for 304 reuse
      this.responseBodyCache.set(key, wrapped);
      return wrapped;
    } catch (error) {
      console.error('Error fetching student groups:', error);
      if (typeof window !== 'undefined') {
        try {
          // eslint-disable-next-line no-console
          console.debug('[studentGroupsService][getStudentGroups][catch]', {
            message: error.message,
            code: error.code,
          });
        } catch (_e) {}
      }
      
      // Normalize errors according to API contract
      const code = error.code || error.response?.data?.code;
      if (code === 'FORBIDDEN' || error.response?.status === 403) {
        throw new Error("You don’t have access to these groups.");
      }
      if (code === 'NOT_FOUND' || error.response?.status === 404) {
        throw new Error("Student not found.");
      }
      throw error;
    }
  }

  /**
   * Get group details (members only)
   * GET /api/students/{studentId}/groups/{groupId}
   * 
   * Validates membership; returns 403 if the student is not a member.
   * 
   * @param {number} studentId - The student ID
   * @param {number} groupId - The group ID
   * @returns {Promise<Object>} API response with group details
   */
  async getGroupDetails(studentId, groupId) {
    try {
      // Real API path
      const key = `GET:/api/students/${studentId}/groups/${groupId}`;
      const config = this.buildConfigWithIMS(key);
      if (typeof window !== 'undefined') {
        try {
          // eslint-disable-next-line no-console
          console.debug('[studentGroupsService][getGroupDetails] about to request', {
            baseURL: apiClient.defaults.baseURL,
            url: `/api/students/${studentId}/groups/${groupId}`,
            ims: config.headers && config.headers['If-Modified-Since'],
            withCredentials: apiClient.defaults.withCredentials,
          });
        } catch (_e) {}
      }
      const response = await api.get(`/api/students/${studentId}/groups/${groupId}`, config);
      if (response.status === 304) {
        const cached = this.responseBodyCache.get(key);
        if (cached) return cached;
        return {
          success: true,
          code: 'OK',
          data: { group: null },
        };
      }
      this.handleConditionalResponse(key, response);
      const wrapped = response.data;
      if (wrapped?.success === false) {
        const reason = wrapped?.code || 'UNKNOWN_ERROR';
        const msg = wrapped?.message || 'Failed to load group';
        const err = new Error(msg);
        err.code = reason;
        throw err;
      }
      this.responseBodyCache.set(key, wrapped);
      return wrapped;
    } catch (error) {
      console.error('Error fetching group details:', error);
      if (typeof window !== 'undefined') {
        try {
          // eslint-disable-next-line no-console
          console.debug('[studentGroupsService][getGroupDetails][catch]', {
            message: error.message,
            code: error.code,
          });
        } catch (_e) {}
      }
      
      const code = error.code || error.response?.data?.code;
      if (code === 'FORBIDDEN' || error.response?.status === 403) {
        throw new Error("You don’t have access to this group.");
      }
      if (code === 'NOT_FOUND' || error.response?.status === 404) {
        throw new Error("We couldn’t find this group.");
      }
      if (code === 'NOT_ELIGIBLE') {
        throw new Error("This assignment doesn’t use group membership.");
      }
      if (code === 'STALE_DATA') {
        throw new Error("This information changed. Please refresh.");
      }
      throw error;
    }
  }

  /**
   * Helper method to get all groups for the current user
   * This is used by dashboard components and doesn't directly map to an API endpoint
   * but uses the getStudentGroups method internally
   * 
   * @returns {Promise<Array>} Array of group summary objects
   */
  async getCurrentUserGroups() {
    try {
      const authState = useAuthStore.getState();
      const studentId = authState?.user?.id;
      if (!studentId) {
        const err = new Error('Missing current student identity');
        err.code = 'UNAUTHENTICATED';
        throw err;
      }
      const response = await this.getStudentGroups(studentId);
      return response.data.data; // Extract the groups array from the paginated response
    } catch (error) {
      console.error('Error fetching current user groups:', error);
      throw error;
    }
  }

  /**
   * Helper method to get group details for the current user
   * This adds the membership validation layer for security
   * 
   * @param {number} groupId - The group ID
   * @returns {Promise<Object>} Group details object
   */
  async getCurrentUserGroupDetails(groupId) {
    try {
      const authState = useAuthStore.getState();
      const studentId = authState?.user?.id;
      if (!studentId) {
        const err = new Error('Missing current student identity');
        err.code = 'UNAUTHENTICATED';
        throw err;
      }
      const response = await this.getGroupDetails(studentId, groupId);
      return response.data.group; // Extract the group object from the response
    } catch (error) {
      console.error('Error fetching current user group details:', error);
      throw error;
    }
  }

  /**
   * Format group data for UI components
   * Transforms API response data into UI-friendly format
   * 
   * @param {Object} group - Raw group data from API
   * @returns {Object} Formatted group data
   */
  formatGroupForUI(group) {
    return {
      id: group.groupId,
      groupId: group.groupId,
      name: group.groupName,
      assignmentId: group.assignmentId,
      assignmentName: group.assignmentName,
      courseCode: group.courseCode,
      courseName: group.courseCode, // Could be expanded with full course name
      semester: group.semester,
      memberCount: group.memberCount || (group.members && group.members.length) || 0,
      status: group.status,
      members: group.members || [],
      // Add additional UI properties
      displayName: `${group.courseCode} - ${group.groupName}`,
      isActive: group.status === 'ACTIVE'
    };
  }

  /**
   * Format member data for UI display
   * 
   * @param {Object} member - Raw member data from API
   * @returns {Object} Formatted member data
   */
  formatMemberForUI(member) {
    return {
      id: member.studentId,
      studentId: member.studentId,
      name: member.name,
      email: member.email,
      isCurrentUser: member.isCurrentUser || false,
      // Generate initials for avatar
      initials: member.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      // Generate display name
      displayName: member.isCurrentUser ? `${member.name} (You)` : member.name
    };
  }
}

// Export singleton instance
export const studentGroupsService = new StudentGroupsService();
