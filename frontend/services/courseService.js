import { api } from './apiClient';

export const courseService = {
    // Get all courses without pagination
  async getAllCourses(filters = {}) {
    const params = {
      pageSize: 60, // Card view shows 60 items per page
      pageNum: 1,
    };
    
    // Only add non-undefined filter values
    if (filters.year) params.year = filters.year;
    if (filters.semester) params.semester = filters.semester;
    if (filters.status) params.status = filters.status;
    if (filters.courseCode) params.courseCode = filters.courseCode;
    if (filters.adminUserId) params.adminUserId = filters.adminUserId;
    
    console.log('getAllCourses API params:', params);
    
    const response = await api.post('/api/courses/list', params);
    return response.data;
  },

  // Get courses with pagination
  async getCoursesPaginated(pageNum = 1, pageSize = 10, filters = {}) {
    const params = {
      pageNum,
      pageSize,
    };
    
    // Only add non-undefined filter values
    if (filters.year) params.year = filters.year;
    if (filters.semester) params.semester = filters.semester;
    if (filters.status) params.status = filters.status;
    if (filters.courseCode) params.courseCode = filters.courseCode;
    if (filters.adminUserId) params.adminUserId = filters.adminUserId;
    
    console.log('getCoursesPaginated API params:', params);
    
    const response = await api.post('/api/courses/list', params);
    return response.data;
  },

  // Get course statistics for dashboard
  async getCourseStats(adminUserId = null) {
    const params = {};
    if (adminUserId) {
      params.adminUserId = adminUserId;
    }
    const response = await api.get('/api/courses/stats', { params });
    // Handle nested data structure from API response
    const result = response.data;
    if (result.success && result.data?.data) {
      // If the API returns nested data structure, flatten it to match expected format
      return {
        success: result.success,
        data: result.data.data
      };
    }
    return result;
  },

  // Get a single course by ID
  async getCourse(courseId) {
    const response = await api.get(`/api/courses/${courseId}`);
    return response.data;
  },

  // Create a new course
  async createCourse(courseData) {
    const response = await api.post('/api/courses', courseData);
    return response.data;
  },

  // Update an existing course
  async updateCourse(courseId, courseData) {
    const response = await api.put(`/api/courses/${courseId}`, courseData);
    return response.data;
  },

  // Delete a course
  async deleteCourse(courseId) {
    const response = await api.delete(`/api/courses/${courseId}`);
    return response.data;
  },

  // Check if course code is available for a specific year
  async checkCourseCodeAvailability(courseCode, year) {
    const response = await api.get(`/api/courses/check-availability/${courseCode}/${year}`);
    return response.data;
  },

  // Get available years for course creation
  async getAvailableYears() {
    const response = await api.get('/api/courses/available-years');
    return response.data;
  },

  // Get course enrollment statistics
  async getCourseEnrollment(courseId) {
    const response = await api.get(`/api/courses/${courseId}/enrollment`);
    return response.data;
  },

  // Activate/deactivate a course
  async toggleCourseStatus(courseId) {
    const response = await api.patch(`/api/courses/${courseId}/toggle-status`);
    return response.data;
  }
};

export default courseService;
