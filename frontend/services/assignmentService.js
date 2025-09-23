import { api } from "./apiClient";

// For development - mock API responses (env-controlled)
const MOCK_FLAG =
  process.env.NEXT_PUBLIC_USE_MOCK_ASSIGNMENTS ??
  process.env.NEXT_PUBLIC_USE_MOCK_API ??
  "false";
const USE_MOCK_API = String(MOCK_FLAG) === "true";

// Utility function to convert date strings to datetime format for Java backend
const formatDateForBackend = (dateString) => {
  if (!dateString) return dateString;
  // If already in datetime format, return as is
  if (dateString.includes('T')) return dateString;
  // Convert YYYY-MM-DD to YYYY-MM-DDTHH:MM:SS format
  return `${dateString}T00:00:00`;
};

const calculateProgressFromSetup = ({
  rubricConfigured,
  timeSlotsConfigured,
  resultsReleased,
}) => {
  const completed = [rubricConfigured, timeSlotsConfigured, resultsReleased]
    .filter(Boolean).length;

  if (completed === 0) return 0;
  if (completed === 1) return 33;
  if (completed === 2) return 66;
  return 100;
};

const deriveMockSetupStatus = (assignment) => {
  const rubricConfigured = Boolean(
    assignment?.hasRubric ||
      assignment?.rubricConfigured ||
      assignment?.rubricStatus === "CONFIGURED"
  );
  const timeSlotsConfigured = Boolean(
    assignment?.hasTimeSlots ||
      assignment?.timeSlotsConfigured ||
      assignment?.scheduleConfigured ||
      assignment?.schedule?.configured
  );
  const resultsReleased = Boolean(
    assignment?.resultsReleased ||
      assignment?.results?.released ||
      assignment?.resultStatus === "RELEASED"
  );

  const progress = calculateProgressFromSetup({
    rubricConfigured,
    timeSlotsConfigured,
    resultsReleased,
  });

  return {
    rubricConfigured,
    timeSlotsConfigured,
    resultsReleased,
    progress,
    releasedOn: resultsReleased ? assignment?.resultsReleasedAt : null,
    lastUpdated: assignment?.updateTime ?? assignment?.createdAt,
  };
};

// Mock assignments data
const mockAssignments = [
  {
    id: 1,
    courseId: 1,
    name: "Project Proposal Presentation",
    description: "Students present initial project ideas",
    type: "group",
    startDate: "2025-03-10",
    endDate: "2025-03-24",
    dueDate: "2025-03-24",
    weight: 15,
    status: "active",
    students: 45,
    groups: 12,
    completedSessions: 8,
    totalSessions: 12,
    hasRubric: true,
    hasTimeSlots: true,
    resultsReleased: true,
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    courseId: 1,
    name: "Mid-Semester Project Update",
    description: "Progress report on project development",
    type: "individual",
    startDate: "2025-04-15",
    endDate: "2025-04-29",
    dueDate: "2025-04-29",
    weight: 25,
    status: "active",
    students: 45,
    groups: 0,
    completedSessions: 0,
    totalSessions: 45,
    hasRubric: true,
    hasTimeSlots: false,
    resultsReleased: false,
    createdAt: "2025-01-20T14:30:00Z",
  },
  {
    id: 3,
    courseId: 1,
    name: "Final Project Deliverable & Demo",
    description: "Group demo and individual Q&A session",
    type: "mixed",
    startDate: "2025-05-20",
    endDate: "2025-06-05",
    dueDate: "2025-06-05",
    weight: 40,
    status: "upcoming",
    students: 45,
    groups: 12,
    completedSessions: 0,
    totalSessions: 60,
    hasRubric: false,
    hasTimeSlots: false,
    resultsReleased: false,
    createdAt: "2025-01-25T09:15:00Z",
  },
];

// Mock service for development
const mockAssignmentService = {
  async getAssignments(courseId) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    // If courseId is provided, filter by it, otherwise return all
    const filteredAssignments = courseId
      ? mockAssignments.filter((a) => a.courseId === parseInt(courseId))
      : mockAssignments;
    return {
      success: true,
      data: filteredAssignments,
    };
  },

  async createAssignment(data) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const newAssignment = {
      id: Date.now(),
      ...data,
      status: "draft",
      students: 0,
      groups: 0,
      completedSessions: 0,
      totalSessions: 0,
      hasRubric: false,
      hasTimeSlots: false,
      resultsReleased: false,
      createdAt: new Date().toISOString(),
    };
    mockAssignments.push(newAssignment);
    return {
      success: true,
      data: newAssignment,
    };
  },

  async updateAssignment(id, data) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const index = mockAssignments.findIndex((a) => a.id === parseInt(id));
    if (index !== -1) {
      mockAssignments[index] = { ...mockAssignments[index], ...data };
      return {
        success: true,
        data: mockAssignments[index],
      };
    }
    return {
      success: false,
      message: "Assignment not found",
    };
  },

  async deleteAssignment(id) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const index = mockAssignments.findIndex((a) => a.id === parseInt(id));
    if (index !== -1) {
      mockAssignments.splice(index, 1);
      return { success: true };
    }
    return {
      success: false,
      message: "Assignment not found",
    };
  },

  async getAssignmentById(id) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("Mock: Getting assignment by ID:", id);
    const assignment = mockAssignments.find(
      (a) => a.id === parseInt(id) || a.id === id
    );

    if (!assignment) {
      console.error("Mock: Assignment not found with ID:", id);
      throw new Error(`Assignment not found with ID: ${id}`);
    }

    console.log("Mock: Found assignment:", assignment);
    return assignment;
  },

  async uploadStudentData(assignmentId, csvFile) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Simulate processing CSV
    return {
      success: true,
      data: {
        studentsImported: 45,
        groupsCreated: 12,
        errors: [],
      },
    };
  },

  async getAssignmentStatus(assignmentId) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const assignment = mockAssignments.find(
      (a) => a.id === parseInt(assignmentId)
    );

    if (!assignment) {
      return {
        success: false,
        code: "404",
        message: "Assignment not found",
      };
    }

    const setupStatus = deriveMockSetupStatus(assignment);

    return {
      success: true,
      code: "200",
      data: {
        assignmentId: assignment.id,
        setupStatus,
      },
    };
  },

  async getAssignmentStats(courseId) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const courseAssignments = mockAssignments.filter(
      (a) => a.courseId === parseInt(courseId)
    );
    return {
      success: true,
      data: {
        total: courseAssignments.length,
        active: courseAssignments.filter((a) => a.status === "active").length,
        upcoming: courseAssignments.filter((a) => a.status === "upcoming")
          .length,
        completed: courseAssignments.filter((a) => a.status === "completed")
          .length,
        totalWeight: courseAssignments.reduce((sum, a) => sum + a.weight, 0),
      },
    };
  },
};

// Actual service implementation
export const assignmentService = {
  async getAssignments(courseId) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.getAssignments(courseId);
    }
    try {
      const url = `/api/assignments/subject/${courseId}`;
      const response = await api.get(url);
      return response.data;
    } catch (e) {
      // Improve frontend-side diagnostics (interceptor also logs a generic message)
      const status = e?.response?.status;
      const data = e?.response?.data;
      // eslint-disable-next-line no-console
      console.warn("[assignmentService] GET /api/assignments/subject/{id} failed", {
        courseId,
        status,
        data,
      });
      return { success: false, message: data?.message || "Assignments fetch failed", code: status };
    }
  },

  async createAssignment(data) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.createAssignment(data);
    }
    
    // Convert date strings to datetime format for Java backend
    const formattedData = {
      ...data,
      startDate: formatDateForBackend(data.startDate),
      endDate: formatDateForBackend(data.endDate),
      dueDate: formatDateForBackend(data.dueDate),
    };
    
    const response = await api.post("/api/assignments", formattedData);
    return response.data;
  },

  async updateAssignment(id, data) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.updateAssignment(id, data);
    }
    
    // Convert date strings to datetime format for Java backend
    const formattedData = {
      ...data,
      startDate: formatDateForBackend(data.startDate),
      endDate: formatDateForBackend(data.endDate),
      dueDate: formatDateForBackend(data.dueDate),
    };
    
    const response = await api.put(`/api/assignments/${id}`, formattedData);
    return response.data;
  },

  async deleteAssignment(id) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.deleteAssignment(id);
    }
    const response = await api.delete(`/api/assignments/${id}`);
    return response.data;
  },

  async getAssignmentById(id) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.getAssignmentById(id);
    }
    const response = await api.get(`/api/assignments/${id}`);
    return response.data;
  },

  async uploadStudentData(assignmentId, csvFile) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.uploadStudentData(
        assignmentId,
        csvFile
      );
    }
    const formData = new FormData();
    formData.append("csv", csvFile);
    const response = await api.post(
      `/api/assignments/${assignmentId}/upload-students`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async getAssignmentStats(courseId) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.getAssignmentStats(courseId);
    }
    try {
      const url = `/api/assignments/subject/${courseId}/stats`;
      const response = await api.get(url);
      return response.data;
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      // eslint-disable-next-line no-console
      console.warn("[assignmentService] GET /api/assignments/subject/{id}/stats failed", {
        courseId,
        status,
        data,
      });
      return { success: false, message: data?.message || "Assignment stats fetch failed", code: status };
    }
  },

  async getAssignmentStatus(assignmentId) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.getAssignmentStatus(assignmentId);
    }

    try {
      const response = await api.get(`/api/assignments/${assignmentId}/status`);
      return response.data;
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      // eslint-disable-next-line no-console
      console.warn("[assignmentService] GET /api/assignments/{id}/status failed", {
        assignmentId,
        status,
        data,
      });
      return {
        success: false,
        message: data?.message || "Assignment status fetch failed",
        code: status,
      };
    }
  },

  // Student CSV Preview - Preview student/group CSV data before import
  async previewStudentCsv(file, type) {
    if (USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock student/group CSV preview based on CSV file
      const mockData = {
        totalRecords: 2,
        groupCount: type === "group" ? 1 : 0,
        preview: [
          { 
            Student: "Yun Chen", 
            ID: "395809", 
            "SIS User ID": "1412174", 
            "SIS Login ID": "yunchen6", 
            Section: "Elements of Data Processing (COMP20008_2025_SM1), Lecture 1 (1), Lecture 2 (1), and Tutorial 1 (4)", 
            "Student Id": "1412174" 
          },
          { 
            Student: "Benyuan Wang", 
            ID: "395810", 
            "SIS User ID": "1492846", 
            "SIS Login ID": "benyuanw", 
            Section: "Elements of Data Processing (COMP20008_2025_SM1), Lecture 1 (1), Lecture 2 (1), and Tutorial 1 (4)", 
            "Student Id": "1492846" 
          }
        ]
      };
      
      return {
        success: true,
        data: mockData
      };
    }
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      
      const response = await api.post("/api/csv/preview", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.data || "Failed to upload CSV",
        code: error.response?.data?.code || error.response?.status || 500,
      };
    }
  },

  // Student CSV Upload - Upload student/group CSV data to backend
  async uploadStudentCsv(file, type, assignmentId) {
    if (USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock student/group CSV upload
      return {
        success: true,
        data: {
          totalCount: 25,
          uploaded: 25,
          groupsCreated: type === "group" ? 8 : 0,
          errors: []
        }
      };
    }
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("assignmentId", assignmentId);
      
      const response = await api.post("/api/csv/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to upload CSV",
        code: error.response?.status || 500,
      };
    }
  },

  // Examiner CSV Preview - Preview examiner CSV data before import
  async previewExaminerCsv(file) {
    if (USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock examiner CSV preview
      return {
        success: true,
        data: {
          totalRecords: 3,
          preview: [
            { ExaminerID: "E001", Name: "Dr. John Smith", Email: "john.smith@unimelb.edu.au", Department: "Computer Science" },
            { ExaminerID: "E002", Name: "Dr. Sarah Johnson", Email: "sarah.johnson@unimelb.edu.au", Department: "Software Engineering" },
            { ExaminerID: "E003", Name: "Prof. Michael Brown", Email: "michael.brown@unimelb.edu.au", Department: "Information Systems" }
          ]
        }
      };
    }
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "examiner");
      
      const response = await api.post("/api/csv/preview", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to preview CSV",
        code: error.response?.status || 500,
      };
    }
  },

  // Examiner CSV Upload - Upload examiner CSV data to backend
  async uploadExaminerCsv(file) {
    if (USE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock examiner CSV upload
      return {
        success: true,
        data: {
          totalCount: 8,
          uploaded: 8,
          errors: []
        }
      };
    }
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "examiner");
      
      const response = await api.post("/api/csv/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to upload CSV",
        code: error.response?.status || 500,
      };
    }
  }
};
