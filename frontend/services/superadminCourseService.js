import { api } from './apiClient';

// Superadmin Course Service
// Handles course management operations for super administrators

export const superadminCourseService = {
  // Get all courses (superadmin view)
  async getCourses(filters = {}) {
    try {
      const response = await api.get('/api/superadmin/courses', { params: filters });
      
      // Debug: Log the raw response to see what backend returns
      console.log('=== COURSES API DEBUG ===');
      console.log('Full response:', response);
      console.log('Response.data:', response?.data);
      console.log('Response.data type:', typeof response?.data);
      console.log('Response.data keys:', response?.data ? Object.keys(response?.data) : 'N/A');
      if (Array.isArray(response?.data)) {
        console.log('Response.data is array, length:', response?.data.length);
        console.log('First item:', response?.data[0]);
      }
      console.log('=== END COURSES DEBUG ===');
      
      // Normalize various backend shapes into the UI-required schema
      const raw = response?.data;
      const payload = (raw && (raw.data ?? raw.result ?? raw.payload)) ?? raw;
      
      let courses = [];
      
      if (Array.isArray(payload)) {
        // Backend returned a flat array of courses
        courses = payload;
      } else if (payload && typeof payload === 'object') {
        // Common aliases from different backends
        if (Array.isArray(payload.courses)) {
          courses = payload.courses;
        } else if (Array.isArray(payload.items) || Array.isArray(payload.list) || Array.isArray(payload.records) || Array.isArray(payload.rows)) {
          courses = payload.items || payload.list || payload.records || payload.rows || [];
        } else {
          // Fallback: try to detect arrays inside object
          const arrays = Object.values(payload).filter(Array.isArray);
          if (arrays.length > 0) {
            courses = arrays[0] || [];
          }
        }
      }
      
      // Debug: Log the normalized data
      console.log('=== NORMALIZED COURSES DEBUG ===');
      console.log('Normalized courses:', courses);
      console.log('=== END NORMALIZED COURSES DEBUG ===');
      
      return { success: true, data: courses };
    } catch (error) {
      console.error('Get courses API error:', error);
      return { success: false, data: [] };
    }
  },

  // Get course by ID
  async getCourseById(courseId) {
    try {
      const response = await api.get(`/api/superadmin/courses/${courseId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get course by ID API error:', error);
      return { success: false, data: null };
    }
  },

  // Get course statistics for superadmin dashboard
  async getCourseStats() {
    // This endpoint is not in the current Swagger API
    // For now, return mock data or implement when backend adds it
    console.warn('Course stats endpoint not available in current backend API');
    return { success: true, data: { totalCourses: 0, activeCourses: 0 } };
  }
};
