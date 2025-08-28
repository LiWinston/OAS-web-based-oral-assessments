import { api } from "./apiClient";

// Superadmin Course Service
// Handles course management operations for super administrators

export const superadminCourseService = {
  // Get all courses (superadmin view)
  async getCourses(filters = {}) {
    try {
      // Build query parameters for SuperAdmin API
      const queryParams = {
        page: filters.page || 1,
        limit: filters.limit || 100, // Large limit for SuperAdmin to see all courses
        year: filters.year || null,
        semester: filters.semester || null,
        search: filters.search || null,
        adminId: filters.adminId || null,
        status: filters.status || null,
        department: filters.department || null,
        sortBy: filters.sortBy || "createdAt",
        sortOrder: filters.sortOrder || "desc"
      };
      
      const response = await api.post("/api/superadmin/courses", queryParams);

      // Debug: Log the raw response to see what backend returns
      console.log("=== COURSES API DEBUG ===");
      console.log("Full response:", response);
      console.log("Response.data:", response?.data);
      console.log("Response.data type:", typeof response?.data);
      console.log(
        "Response.data keys:",
        response?.data ? Object.keys(response?.data) : "N/A"
      );
      if (Array.isArray(response?.data)) {
        console.log("Response.data is array, length:", response?.data.length);
        console.log("First item:", response?.data[0]);
      }
      console.log("=== END COURSES DEBUG ===");

      // Normalize various backend shapes into the UI-required schema
      const raw = response?.data;
      const payload = (raw && (raw.data ?? raw.result ?? raw.payload)) ?? raw;

      let courses = [];

      if (Array.isArray(payload)) {
        // Backend returned a flat array of courses
        courses = payload;
      } else if (payload && typeof payload === "object") {
        // Common aliases from different backends
        if (Array.isArray(payload.courses)) {
          courses = payload.courses;
        } else if (
          Array.isArray(payload.items) ||
          Array.isArray(payload.list) ||
          Array.isArray(payload.records) ||
          Array.isArray(payload.rows)
        ) {
          courses =
            payload.items ||
            payload.list ||
            payload.records ||
            payload.rows ||
            [];
        } else {
          // Fallback: try to detect arrays inside object
          const arrays = Object.values(payload).filter(Array.isArray);
          if (arrays.length > 0) {
            courses = arrays[0] || [];
          }
        }
      }

      // Normalize field names to match frontend expectations
      courses = courses.map((course) => ({
        id: course.id,
        name: course.courseName || course.name || "Unknown Course",
        code: course.courseCode || course.code || "N/A",
        department: course.department || "Unknown Department",
        admin: course.admin || course.adminName || "Unassigned",
        adminEmail:
          course.adminEmail || course.adminEmailAddress || "No email available",
        students: course.students || course.studentCount || 0,
        assignments: course.assignments || course.assignmentCount || 0,
        activeAssignments:
          course.activeAssignments || course.activeAssignmentCount || 0,
        status: course.status || course.courseStatus || "inactive",
        semester: course.semester || "N/A",
        venue: course.venue || "TBD",
        lastActivity:
          course.lastActivity || course.lastActive || "No activity recorded",
        completionRate: course.completionRate || course.completion || 0,
        description:
          course.description ||
          course.courseDescription ||
          "No description available",
      }));

      // Debug: Log the normalized data
      console.log("=== NORMALIZED COURSES DEBUG ===");
      console.log("Normalized courses:", courses);
      console.log("=== END NORMALIZED COURSES DEBUG ===");

      return { success: true, data: courses };
    } catch (error) {
      console.error("SuperAdmin courses API error:", error);
      return { success: false, data: [] };
    }
  },

  // Get course by ID
  async getCourseById(courseId) {
    try {
      const response = await api.get(`/api/superadmin/courses/${courseId}`);

      // Debug: Log the raw response to see what backend returns
      console.log("=== COURSE BY ID API DEBUG ===");
      console.log("Course ID:", courseId);
      console.log("Full response:", response);
      console.log("Response.data:", response?.data);
      console.log("=== END COURSE BY ID DEBUG ===");

      // Ensure the returned data has required fields with fallbacks
      const courseData = response?.data || {};
      const normalizedCourse = {
        id: courseData.id || courseId,
        name: courseData.name || courseData.courseName || "Unknown Course",
        code: courseData.code || courseData.courseCode || "N/A",
        department:
          courseData.department || courseData.dept || "Unknown Department",
        admin:
          courseData.admin ||
          courseData.administrator ||
          courseData.adminName ||
          null,
        adminEmail:
          courseData.adminEmail || courseData.administratorEmail || null,
        students:
          courseData.students ||
          courseData.studentCount ||
          courseData.enrolledStudents ||
          0,
        assignments:
          courseData.assignments ||
          courseData.assignmentList ||
          courseData.assignmentDetails ||
          [],
        assignmentCount:
          courseData.assignmentCount ||
          courseData.totalAssignments ||
          (Array.isArray(courseData.assignments)
            ? courseData.assignments.length
            : 0),
        activeAssignments:
          courseData.activeAssignments || courseData.activeAssignmentCount || 0,
        examinerCount: courseData.examinerCount || courseData.examiners || 0,
        completionRate: courseData.completionRate || courseData.completion || 0,
        lastActivity:
          courseData.lastActivity ||
          courseData.lastActive ||
          "No activity recorded",
        status: courseData.status || courseData.courseStatus || "active",
        description:
          courseData.description ||
          courseData.courseDescription ||
          "No description available",
      };

      return { success: true, data: normalizedCourse };
    } catch (error) {
      console.error("Get course by ID API error:", error);
      return { success: false, data: null };
    }
  },

  // Get course statistics for superadmin dashboard (global stats)
  async getCourseStats() {
    try {
      // SuperAdmin调用不带adminUserId参数的统计接口，获取全局数据
      const response = await api.get('/api/courses/stats');
      
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
    } catch (error) {
      console.error("Failed to fetch SuperAdmin course statistics:", error);
      return { 
        success: false, 
        message: "Failed to load statistics",
        data: { totalCourses: 0, activeCourses: 0, totalAssignments: 0 } 
      };
    }
  },
};
