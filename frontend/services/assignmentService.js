import { api } from "./apiClient";

const buildErrorResult = (message, code, data) => ({
  success: false,
  message,
  code,
  data,
});

const normalizeResult = (result) => {
  if (!result) {
    return buildErrorResult("Empty response from server", "NO_RESPONSE", null);
  }

  if (result.success) {
    return result;
  }

  const fallbackMessage =
    typeof result.data === "string"
      ? result.data
      : result.message ||
        (typeof result.data === "object" && result.data?.message) ||
        "Request failed";

  return {
    ...result,
    message: fallbackMessage,
  };
};

const normalizeAxiosError = (error, defaultMessage) => {
  const responseData = error?.response?.data;
  const apiMessage =
    responseData?.message ||
    (typeof responseData?.data === "string" ? responseData.data : null);
  const message = apiMessage || defaultMessage || "Request failed";
  const code = responseData?.code || error?.response?.status || 500;
  const data =
    typeof responseData?.data === "object" ? responseData.data : responseData?.data;

  return buildErrorResult(message, code, data);
};

const extractFilenameFromHeaders = (headers) => {
  if (!headers) return null;
  const disposition =
    headers["content-disposition"] || headers["Content-Disposition"];
  if (!disposition) return null;

  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(
    disposition
  );
  if (!match) return null;

  try {
    return decodeURIComponent(match[1] || match[2]);
  } catch (_e) {
    return match[1] || match[2];
  }
};

const parseBlobResponse = async (response, defaultMessage) => {
  const blob = response?.data;
  const headerContentType = response?.headers?.["content-type"];
  const normalizedContentType = (blob?.type || headerContentType || "").toLowerCase();

  if (normalizedContentType.includes("application/json")) {
    try {
      const text = await blob.text();
      const payload = JSON.parse(text);
      const message =
        payload?.message ||
        (typeof payload?.data === "string" ? payload.data : null) ||
        defaultMessage;
      return buildErrorResult(
        message,
        payload?.code || "DOWNLOAD_ERROR",
        payload?.data ?? null
      );
    } catch (parseError) {
      return buildErrorResult(
        parseError?.message || defaultMessage,
        "DOWNLOAD_ERROR",
        null
      );
    }
  }

  if (!normalizedContentType || normalizedContentType.includes("text/plain")) {
    try {
      const text = await blob.text();
      const trimmed = text.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const payload = JSON.parse(trimmed);
        const message =
          payload?.message ||
          (typeof payload?.data === "string" ? payload.data : null) ||
          defaultMessage;
        return buildErrorResult(
          message,
          payload?.code || "DOWNLOAD_ERROR",
          payload?.data ?? null
        );
      }
    } catch (_ignored) {
      // Ignore and assume blob contains the expected binary payload
    }
  }

  return {
    success: true,
    data: {
      blob,
      filename: extractFilenameFromHeaders(response?.headers),
    },
  };
};

// Utility function to convert date strings to datetime format for Java backend
const formatDateForBackend = (dateString) => {
  if (!dateString) return dateString;
  // If already in datetime format, return as is
  if (dateString.includes('T')) return dateString;
  // Convert YYYY-MM-DD to YYYY-MM-DDTHH:MM:SS format
  return `${dateString}T00:00:00`;
};

export const assignmentService = {
  async getAssignments(courseId) {
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
    const response = await api.delete(`/api/assignments/${id}`);
    return response.data;
  },

  async getAssignmentById(id) {
    const response = await api.get(`/api/assignments/${id}`);
    return response.data;
  },

  async savePredefinedComment(assignmentId, criterionDescription, levelDescription, commentText) {
    try {
      // First get the current assignment data
      const assignmentResponse = await this.getAssignmentById(assignmentId);
      if (!assignmentResponse?.success || !assignmentResponse?.data) {
        throw new Error('Failed to fetch assignment data');
      }

      const assignment = assignmentResponse.data;
      const rubricsInfo = [...(assignment.rubricsInfo || [])];

      // Find the criterion that matches the description
      const criterionIndex = rubricsInfo.findIndex(criterion => 
        criterion.description === criterionDescription
      );

      if (criterionIndex === -1) {
        throw new Error('Criterion not found');
      }

      // Find the performance level that matches the description
      const performanceLevels = [...(rubricsInfo[criterionIndex].performanceLevel || [])];
      const levelIndex = performanceLevels.findIndex(level => 
        level.description === levelDescription
      );

      if (levelIndex === -1) {
        throw new Error('Performance level not found');
      }

      // Add the comment to the preDefinedComment array if it doesn't already exist
      const existingComments = performanceLevels[levelIndex].preDefinedComment || [];
      if (!existingComments.includes(commentText)) {
        performanceLevels[levelIndex] = {
          ...performanceLevels[levelIndex],
          preDefinedComment: [...existingComments, commentText]
        };

        // Update the rubricsInfo
        rubricsInfo[criterionIndex] = {
          ...rubricsInfo[criterionIndex],
          performanceLevel: performanceLevels
        };

        // Update the assignment with the new rubricsInfo
        const updateData = {
          ...assignment,
          rubricsInfo: rubricsInfo
        };

        const response = await api.put(`/api/assignments/${assignmentId}`, updateData);
        return response.data;
      } else {
        return {
          success: true,
          message: 'Comment already exists'
        };
      }
    } catch (error) {
      console.error('Error saving predefined comment:', error);
      return {
        success: false,
        message: error.message || 'Failed to save comment'
      };
    }
  },

  async uploadStudentData(assignmentId, csvFile) {
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
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      
      const response = await api.post("/api/csv/preview", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return normalizeResult(response.data);
    } catch (error) {
      return normalizeAxiosError(error, "Failed to preview CSV");
    }
  },

  // Student CSV Upload - Upload student/group CSV data to backend
  async uploadStudentCsv(file, type, assignmentId) {
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
      return normalizeResult(response.data);
    } catch (error) {
      return normalizeAxiosError(error, "Failed to upload CSV");
    }
  },

  // Examiner CSV Preview - Preview examiner CSV data before import
  async previewExaminerCsv(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "examiner");
      
      const response = await api.post("/api/csv/preview", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return normalizeResult(response.data);
    } catch (error) {
      return normalizeAxiosError(error, "Failed to preview CSV");
    }
  },

  // Examiner CSV Upload - Upload examiner CSV data to backend
  async uploadExaminerCsv(file, assignmentId) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "examiner");
      if (assignmentId != null) {
        formData.append("assignmentId", assignmentId);
      }
      
      const response = await api.post("/api/csv/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return normalizeResult(response.data);
    } catch (error) {
      return normalizeAxiosError(error, "Failed to upload CSV");
    }
  },

  async fetchCsvHistory(params = {}) {
    try {
      const response = await api.post("/api/csv/history/list", params);
      return normalizeResult(response.data);
    } catch (error) {
      return normalizeAxiosError(error, "Failed to fetch CSV history");
    }
  },

  async downloadCsvHistoryFile(id) {
    try {
      const response = await api.get(`/api/csv/history/download/${id}`, {
        responseType: "blob",
      });

      const parsed = await parseBlobResponse(response, "Failed to download CSV");
      return parsed;
    } catch (error) {
      return normalizeAxiosError(error, "Failed to download CSV");
    }
  },

  async exportAssignmentGrades(assignmentId, type) {
    try {
      const response = await api.get("/api/csv/export/grades", {
        params: {
          assignmentId,
          ...(type ? { type } : {}),
        },
        responseType: "blob",
      });

      const parsed = await parseBlobResponse(response, "Failed to export grades");
      return parsed;
    } catch (error) {
      return normalizeAxiosError(error, "Failed to export grades");
    }
  },

  async exportTeacherScoringDetails(assignmentId) {
    try {
      const response = await api.get("/api/csv/export/teacher-scoring-details", {
        params: { assignmentId },
        responseType: "blob",
      });

      const parsed = await parseBlobResponse(response, "Failed to export teacher scoring details");
      return parsed;
    } catch (error) {
      return normalizeAxiosError(error, "Failed to export teacher scoring details");
    }
  },
};
