import { api } from "./apiClient";

// For development - mock API responses
const USE_MOCK_API = true;

// Mock assignments data
const mockAssignments = [
  {
    id: 1,
    courseId: 1,
    title: "Project Proposal Presentation",
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
    hasExaminers: true,
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    courseId: 1,
    title: "Mid-Semester Project Update",
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
    hasExaminers: false,
    createdAt: "2025-01-20T14:30:00Z",
  },
  {
    id: 3,
    courseId: 1,
    title: "Final Project Deliverable & Demo",
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
    hasExaminers: false,
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
      hasExaminers: false,
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
    const response = await api.get(`/courses/${courseId}/assignments`);
    return response.data;
  },

  async createAssignment(data) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.createAssignment(data);
    }
    const response = await api.post("/assignments", data);
    return response.data;
  },

  async updateAssignment(id, data) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.updateAssignment(id, data);
    }
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  async deleteAssignment(id) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.deleteAssignment(id);
    }
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  async getAssignmentById(id) {
    if (USE_MOCK_API) {
      return await mockAssignmentService.getAssignmentById(id);
    }
    const response = await api.get(`/assignments/${id}`);
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
      `/assignments/${assignmentId}/upload-students`,
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
    const response = await api.get(`/courses/${courseId}/assignments/stats`);
    return response.data;
  },
};
