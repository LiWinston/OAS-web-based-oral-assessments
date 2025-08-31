import { api } from "./apiClient";

// Superadmin Course Service
// Handles course management operations for super administrators

export const superadminCourseService = {
  // Get all courses (superadmin view)
  async getCourses(filters = {}, page = 1, pageSize = 20) {
    try {
      // Add pagination parameters to the request
      const requestParams = {
        ...filters,
        page: page,
        limit: pageSize
      };

      const response = await api.post("/api/superadmin/courses", requestParams);

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

      // Extract data from backend response
      // Based on the backend response structure: response.data.data.courses and response.data.data.pagination
      const raw = response?.data;
      const payload = (raw && (raw.data ?? raw.result ?? raw.payload)) ?? raw;

      let courses = [];
      let pagination = {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: pageSize,
        hasNext: false,
        hasPrev: false
      };

      if (Array.isArray(payload)) {
        // Backend returned a flat array of courses
        courses = payload;
      } else if (payload && typeof payload === "object") {
        // Extract courses array
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

        // Extract pagination info
        if (payload.pagination) {
          pagination = {
            currentPage: payload.pagination.currentPage || page,
            totalPages: payload.pagination.totalPages || 1,
            totalItems: payload.pagination.totalItems || courses.length,
            itemsPerPage: payload.pagination.itemsPerPage || pageSize,
            hasNext: payload.pagination.hasNext || false,
            hasPrev: payload.pagination.hasPrev || false
          };
        }
      }

      // Normalize field names to match frontend expectations
      courses = courses.map((course) => {
        // Debug: Log the raw course status data
        console.log("=== COURSE STATUS DEBUG ===");
        console.log("Course ID:", course.id);
        console.log("Raw course.status:", course.status);
        console.log("Raw course.courseStatus:", course.courseStatus);
        console.log("Raw course.status type:", typeof course.status);
        console.log("Raw course.courseStatus type:", typeof course.courseStatus);
        console.log("=== END COURSE STATUS DEBUG ===");

        return {
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
        };
      });

      // Debug: Log the normalized data
      console.log("=== NORMALIZED COURSES DEBUG ===");
      console.log("Normalized courses:", courses);
      console.log("Pagination info:", pagination);
      console.log("=== END NORMALIZED COURSES DEBUG ===");

      return { 
        success: true, 
        data: courses,
        pagination: pagination
      };
    } catch (error) {
      console.error("Get courses API error:", error);
      return { 
        success: false, 
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: pageSize,
          hasNext: false,
          hasPrev: false
        }
      };
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

  // Get course statistics for superadmin dashboard
  async getCourseStats() {
    try {
      const response = await api.get("/api/courses/stats");
      
      // Debug: Log the raw response to see what backend returns
      console.log("=== COURSE STATS API DEBUG ===");
      console.log("Full response:", response);
      console.log("Response.data:", response?.data);
      console.log("=== END COURSE STATS DEBUG ===");

      // Extract data from backend response
      const raw = response?.data;
      
      // Debug: Log the raw data structure
      console.log("Raw response.data:", raw);
      console.log("Raw response.data type:", typeof raw);
      console.log("Raw response.data keys:", raw ? Object.keys(raw) : "N/A");
      
      // The API response structure is: { code, success, data: { totalCourses, activeCourses, ... } }
      // So we need to access raw.data.data to get the actual stats
      const payload = raw?.data?.data || raw?.data || raw;

      // Normalize the stats data
      const stats = {
        totalCourses: payload?.totalCourses || payload?.total || 0,
        activeCourses: payload?.activeCourses || payload?.active || 0,
        totalStudents: payload?.totalStudents || payload?.students || 0,
        totalDepartments: payload?.totalDepartments || payload?.departments || 0,
        totalAssignments: payload?.totalAssignments || 0
      };

      console.log("=== NORMALIZED STATS DEBUG ===");
      console.log("Normalized stats:", stats);
      console.log("=== END NORMALIZED STATS DEBUG ===");

      return { success: true, data: stats };
    } catch (error) {
      console.error("Get course stats API error:", error);
      // Return fallback data if API fails
      return { 
        success: false, 
        data: { 
          totalCourses: 0, 
          activeCourses: 0, 
          totalStudents: 0, 
          totalDepartments: 0,
          totalAssignments: 0
        } 
      };
    }
  },
};
