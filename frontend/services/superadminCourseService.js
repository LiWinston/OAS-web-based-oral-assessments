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
          students: course.students || course.studentCount || course.studentsCount || 0,
          assignments: course.assignments || course.assignmentCount || course.assignmentsCount || 0,
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

  // DEPRECATED: Get course details by course code using the /api/courses GET endpoint
  // This method is no longer needed as /api/superadmin/courses now returns complete data
  async getCourseDetails(courseCode) {
    try {
      console.log("=== GET COURSE DETAILS DEBUG ===");
      console.log("Getting course details for courseCode:", courseCode);
      
      const requestParams = {
        courseCode: courseCode
      };

      console.log("Request URL: /api/courses");
      console.log("Request Method: GET");
      console.log("Request params (query parameters):", requestParams);
      console.log("Full request URL will be:", `/api/courses?pageNum=1&pageSize=1&courseCode=${courseCode}`);
      
      const requestConfig = {
        params: requestParams,
        timeout: 5000
      };
      console.log("Complete Request Configuration:", requestConfig);
      console.log("Request Body: N/A (GET request uses query parameters)");
      
      // Check authentication headers
      console.log("🔐 Checking authentication...");
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log("Token exists:", !!token);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log("Token payload:", payload);
          console.log("User role:", payload.role);
          console.log("User ID:", payload.userId);
        } catch (e) {
          console.log("Could not decode token:", e.message);
        }
      }

      // Make the API request with correct parameters
      console.log("🚀 Sending request...");
      const response = await api.get("/api/courses", requestConfig);
      
      console.log(`=== RESPONSE BODY FOR ${courseCode} ===`);
      console.log("HTTP Status:", response?.status);
      console.log("Complete Response Body:");
      console.log(JSON.stringify(response?.data, null, 2));
      console.log("=== END RESPONSE BODY ===");

      // Check if we got any data
      console.log(`=== DATA ANALYSIS FOR ${courseCode} ===`);
      
      if (response?.data?.success && response.data.data) {
        const payload = response.data.data;
        console.log("Payload total items:", payload.total || 0);
        console.log("Payload data array length:", Array.isArray(payload.data) ? payload.data.length : "Not an array");
        
        if (Array.isArray(payload.data) && payload.data.length === 0) {
          console.log(`⚠️  No course found with courseCode: ${courseCode}`);
          
          // Try to get all courses to see what's available
          console.log("🔍 Fetching all courses to see what's available...");
          const allCoursesParams = { pageNum: 1, pageSize: 10 };
          console.log("All courses request params:", allCoursesParams);
          console.log("All courses request URL: /api/courses?pageNum=1&pageSize=10");
          
          try {
            const allCoursesResponse = await api.get("/api/courses", { 
              params: allCoursesParams,
              timeout: 5000
            });
            
            console.log("=== ALL COURSES RESPONSE (/api/courses) ===");
            console.log("HTTP Status:", allCoursesResponse?.status);
            console.log("Response Body:");
            console.log(JSON.stringify(allCoursesResponse?.data, null, 2));
            console.log("=== END ALL COURSES RESPONSE ===");
            
            // Also try the POST method for /api/courses
            console.log("🔍 Trying POST method /api/courses/list...");
            const coursesPostResponse = await api.post("/api/courses/list", {
              pageNum: 1,
              pageSize: 10,
              courseCode: courseCode
            });
            
            console.log("=== COURSES POST RESPONSE (/api/courses/list) ===");
            console.log("HTTP Status:", coursesPostResponse?.status);
            console.log("Response Body:");
            console.log(JSON.stringify(coursesPostResponse?.data, null, 2));
            console.log("=== END COURSES POST RESPONSE ===");
            
            // Also try the superadmin courses API for comparison
            console.log("🔍 Comparing with /api/superadmin/courses...");
            const superadminCoursesResponse = await api.post("/api/superadmin/courses", {
              page: 1,
              limit: 10
            });
            
            console.log("=== SUPERADMIN COURSES RESPONSE (/api/superadmin/courses) ===");
            console.log("HTTP Status:", superadminCoursesResponse?.status);
            console.log("Response Body:");
            console.log(JSON.stringify(superadminCoursesResponse?.data, null, 2));
            console.log("=== END SUPERADMIN COURSES RESPONSE ===");
            
            // Check which API has data
            const regularCoursesCount = allCoursesResponse?.data?.data?.total || 0;
            const superadminCoursesCount = superadminCoursesResponse?.data?.data?.length || 0;
            
            console.log("📊 API Comparison:");
            console.log(`/api/courses total: ${regularCoursesCount}`);
            console.log(`/api/superadmin/courses total: ${superadminCoursesCount}`);
            
            if (regularCoursesCount === 0 && superadminCoursesCount > 0) {
              console.log("🔍 ISSUE FOUND: /api/courses returns no data, but /api/superadmin/courses has data!");
              console.log("This suggests the APIs query different data sources or have different access permissions.");
            }
            
            if (allCoursesResponse?.data?.data?.data && Array.isArray(allCoursesResponse.data.data.data) && allCoursesResponse.data.data.data.length > 0) {
              console.log("📋 Available courses from /api/courses:");
              allCoursesResponse.data.data.data.forEach((course, index) => {
                console.log(`${index + 1}. Code: "${course.courseCode || course.code}", Name: "${course.courseName || course.name}"`);
              });
            } else {
              console.log("❌ /api/courses returned no courses");
            }
            
            if (superadminCoursesResponse?.data?.data && Array.isArray(superadminCoursesResponse.data.data) && superadminCoursesResponse.data.data.length > 0) {
              console.log("📋 Available courses from /api/superadmin/courses:");
              superadminCoursesResponse.data.data.forEach((course, index) => {
                console.log(`${index + 1}. Code: "${course.code}", Name: "${course.name}"`);
              });
            }
            
          } catch (error) {
            console.log("❌ Error fetching all courses:", error.message);
          }
          
          console.log("Possible reasons for not finding the course:");
          console.log("1. Course code doesn't exist in database");
          console.log("2. Course code format is incorrect");
          console.log("3. Course is inactive or archived");
          console.log("4. API endpoint requires different parameters");
          console.log("=== END DATA ANALYSIS ===");
          
          return {
            success: false,
            data: { students: 0, assignments: 0 },
            error: `No course found with code: ${courseCode}`
          };
        }
        
        // Try different data structures
        let courseData = null;
        
        if (payload && Array.isArray(payload.data) && payload.data.length > 0) {
          // Nested structure: payload.data[0]
          courseData = payload.data[0];
          console.log("✅ Found course data using nested structure");
        } else if (payload && Array.isArray(payload) && payload.length > 0) {
          // Direct array: payload[0]
          courseData = payload[0];
          console.log("✅ Found course data using direct array structure");
        } else if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          // Single object: payload itself
          courseData = payload;
          console.log("✅ Found course data using single object structure");
        }
        
        if (courseData) {
          // Try different field names for students and assignments
          const studentsValue = courseData.students || courseData.studentCount || courseData.studentsCount || courseData.totalStudents || 0;
          const assignmentsValue = courseData.assignments || courseData.assignmentCount || courseData.assignmentsCount || courseData.totalAssignments || 0;
          
          console.log(`=== EXTRACTED DATA FOR ${courseCode} ===`);
          console.log("Students:", studentsValue);
          console.log("Assignments:", assignmentsValue);
          console.log("=== END EXTRACTED DATA ===");
          console.log("=== END DATA ANALYSIS ===");
          
          return {
            success: true,
            data: {
              students: studentsValue,
              assignments: assignmentsValue
            }
          };
        } else {
          console.log("❌ No valid course data found in payload");
          console.log("=== END DATA ANALYSIS ===");
        }
      } else {
        console.log("❌ Response validation failed");
        console.log("Success:", response?.data?.success);
        console.log("Data exists:", !!response?.data?.data);
        console.log("=== END DATA ANALYSIS ===");
      }

      return {
        success: false,
        data: { students: 0, assignments: 0 }
      };
    } catch (error) {
      console.error(`Failed to get course details for ${courseCode}:`, error);
      return {
        success: false,
        data: { students: 0, assignments: 0 }
      };
    }
  },

  // Batch get course details for multiple courses
  async getBatchCourseDetails(courseCodes) {
    try {
      console.log("=== BATCH COURSE DETAILS DEBUG ===");
      console.log("Getting batch course details for:", courseCodes);
      console.log("Total courses to fetch:", courseCodes.length);
      
      // Limit concurrent requests to avoid server overload
      const BATCH_SIZE = 3;
      const results = new Map();
      
      for (let i = 0; i < courseCodes.length; i += BATCH_SIZE) {
        const batch = courseCodes.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}:`, batch);
        
        const batchPromises = batch.map(courseCode => 
          this.getCourseDetails(courseCode)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        batch.forEach((courseCode, index) => {
          results.set(courseCode, batchResults[index]);
          console.log(`Result for ${courseCode}:`, batchResults[index]);
        });
        
        // Add a small delay between batches to be respectful to the server
        if (i + BATCH_SIZE < courseCodes.length) {
          console.log("Adding 100ms delay before next batch...");
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log("=== FINAL BATCH RESULTS ===");
      console.log("Results map:", results);
      console.log("=== END BATCH COURSE DETAILS DEBUG ===");
      
      return results;
    } catch (error) {
      console.error("Failed to get batch course details:", error);
      return new Map();
    }
  },

  // Get course statistics for superadmin dashboard (global stats)
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
