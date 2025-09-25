import { api } from './apiClient';

// For development - mock API responses
const USE_MOCK_API = false;

// Mock courses data with proper IDs
const mockCourses = [
  {
    id: 1,
    courseName: "Software Project Management",
    courseCode: "COMP90082", 
    academicYear: 2025,
    semester: "2",
    description: "Learn to manage software projects effectively",
    isActive: true,
    status: "active",
    students: 120,
    assignments: 4,
    createdAt: '2025-01-01T10:00:00Z'
  },
  {
    id: 2,
    courseName: "Web Information Technologies",
    courseCode: "INFO30005",
    academicYear: 2025, 
    semester: "1",
    description: "Modern web development technologies",
    isActive: true,
    status: "active",
    students: 85,
    assignments: 3,
    createdAt: '2025-01-05T14:30:00Z'
  },
  {
    id: 3,
    courseName: "Database Systems",
    courseCode: "INFO20003",
    academicYear: 2024,
    semester: "2",
    description: "Database design and implementation", 
    isActive: false,
    status: "archived",
    students: 65,
    assignments: 2,
    createdAt: '2024-07-01T09:00:00Z'
  },
  {
    id: 4,
    courseName: "Machine Learning",
    courseCode: "COMP30024",
    academicYear: 2025,
    semester: "1",
    description: "Introduction to machine learning concepts",
    isActive: true,
    status: "active", 
    students: 95,
    assignments: 3,
    createdAt: '2025-01-10T11:00:00Z'
  },
  {
    id: 5,
    courseName: "Software Engineering Process",
    courseCode: "SWEN90009",
    academicYear: 2025,
    semester: "2",
    description: "Software engineering methodologies and practices",
    isActive: true,
    status: "active",
    students: 78,
    assignments: 2,
    createdAt: '2025-01-15T13:00:00Z'
  }
];

// Mock service implementation
const mockCourseService = {
  async getCourses(filters = {}) {
    await new Promise(resolve => setTimeout(resolve, 500));
    let filtered = [...mockCourses];
    
    if (filters.year) {
      filtered = filtered.filter(c => c.academicYear === parseInt(filters.year));
    }
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    return {
      success: true,
      data: filtered
    };
  },

  async getCourse(courseId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const course = mockCourses.find(c => c.id === parseInt(courseId));
    
    if (!course) {
      return {
        success: false,
        message: 'Course not found'
      };
    }
    
    return {
      success: true,
      data: course
    };
  },

  async getCourseStats() {
    await new Promise(resolve => setTimeout(resolve, 400));
    const activeCourses = mockCourses.filter(c => c.status === 'active');
    const totalStudents = mockCourses.reduce((sum, c) => sum + c.students, 0);
    const totalAssignments = mockCourses.reduce((sum, c) => sum + c.assignments, 0);
    
    return {
      success: true,
      data: {
        totalCourses: mockCourses.length,
        activeCourses: activeCourses.length,
        totalStudents,
        totalAssignments,
        currentSemester: '2025 Semester 2'
      }
    };
  }
};

export const courseService = {
    // Get all courses without pagination
  async getAllCourses(filters = {}) {
    if (USE_MOCK_API) {
      return await mockCourseService.getCourses(filters);
    }
    
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
    if (USE_MOCK_API) {
      return await mockCourseService.getCourses(filters);
    }
    
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
    if (USE_MOCK_API) {
      return await mockCourseService.getCourseStats();
    }
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
    if (USE_MOCK_API) {
      return await mockCourseService.getCourse(courseId);
    }
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