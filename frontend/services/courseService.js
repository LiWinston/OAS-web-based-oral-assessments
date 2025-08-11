import { api } from './apiClient';

export const courseService = {
  // Get all courses for the current admin
  async getCourses(filters = {}) {
    const response = await api.get('/courses', { params: filters });
    return response.data;
  },

  // Get course statistics for dashboard
  async getCourseStats() {
    const response = await api.get('/courses/stats');
    return response.data;
  },

  // Get a single course by ID
  async getCourse(courseId) {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  // Create a new course
  async createCourse(courseData) {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  // Update an existing course
  async updateCourse(courseId, courseData) {
    const response = await api.put(`/courses/${courseId}`, courseData);
    return response.data;
  },

  // Delete a course
  async deleteCourse(courseId) {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data;
  },

  // Check if course code is available for a specific year
  async checkCourseCodeAvailability(courseCode, year) {
    const response = await api.get(`/courses/check-availability/${courseCode}/${year}`);
    return response.data;
  },

  // Get available years for course creation
  async getAvailableYears() {
    const response = await api.get('/courses/available-years');
    return response.data;
  },

  // Get course enrollment statistics
  async getCourseEnrollment(courseId) {
    const response = await api.get(`/courses/${courseId}/enrollment`);
    return response.data;
  },

  // Activate/deactivate a course
  async toggleCourseStatus(courseId) {
    const response = await api.patch(`/courses/${courseId}/toggle-status`);
    return response.data;
  }
};

export default courseService;