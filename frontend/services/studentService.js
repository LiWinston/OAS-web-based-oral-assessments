import { api } from "./apiClient";
import { studentResultsService } from "./studentResultsService";
import { studentGroupsService } from "./studentGroupsService";
import { studentBookingServiceReal } from "./studentBookingReal";
import useAuthStore from "../store/authStore";

const requireStudentId = () => {
  const authState = useAuthStore.getState();
  const studentId = authState?.user?.id;
  if (!studentId) {
    const err = new Error("Missing authenticated student identity");
    err.code = "UNAUTHENTICATED";
    throw err;
  }
  return studentId;
};

const normalizeResult = (response) => response?.data ?? response;

class StudentService {
  async getProfile() {
    const response = await api.get("/api/profile/me");
    return normalizeResult(response);
  }

  async getStats() {
    const studentId = requireStudentId();

    const [assignmentsResult, groups, resultsResult] = await Promise.all([
      studentBookingServiceReal.getStudentAssignments(studentId, {
        status: "all",
        pageNum: 0,
        pageSize: 200,
        sort: "date_desc",
      }),
      studentGroupsService.getStudentGroups(studentId).then((res) => {
        const payload = res?.data;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
      }),
      studentResultsService.getStudentResults(studentId, {
        status: "released",
        pageNum: 0,
        pageSize: 200,
        sort: "date_desc",
      }),
    ]);

    const assignments =
      assignmentsResult?.data?.data ??
      assignmentsResult?.data?.items ??
      assignmentsResult?.data ??
      [];

    const totalAssessments =
      assignmentsResult?.data?.total ?? assignments.length ?? 0;

    const normalizedStatus = (value) =>
      (value || "").toString().toLowerCase();
    const upcomingAssessments = assignments.filter((item) => {
      const status = normalizedStatus(item.status ?? item.bookingStatus);
      return status === "bookable" || status === "upcoming" || status === "available";
    }).length;

    const completedAssessments = assignments.filter((item) => {
      const status = normalizedStatus(item.status ?? item.bookingStatus);
      return (
        status === "completed" ||
        status === "released" ||
        status === "finished"
      );
    }).length;

    const resultItems =
      resultsResult?.data?.data?.data ??
      resultsResult?.data?.data ??
      [];

    const scoreValues = resultItems
      .map((entry) => entry?.finalScore?.percentage)
      .filter((value) => typeof value === "number" && Number.isFinite(value));

    const averageScore =
      scoreValues.length > 0
        ? scoreValues.reduce((sum, value) => sum + value, 0) /
          scoreValues.length
        : null;

    return {
      totalAssessments,
      upcomingAssessments,
      completedAssessments,
      averageScore,
      activeGroups: groups.length,
    };
  }

  async getAssessments(status = "all", options = {}) {
    const studentId = requireStudentId();
    const response = await studentBookingServiceReal.getStudentAssignments(
      studentId,
      { status, ...options }
    );
    return response;
  }

  async getResults(options = {}) {
    const studentId = requireStudentId();
    return studentResultsService.getStudentResults(studentId, {
      status: "released",
      ...options,
    });
  }

  async getGroups(options = {}) {
    const studentId = requireStudentId();
    const response = await studentGroupsService.getStudentGroups(
      studentId,
      options
    );
    return response;
  }

  async bookAssessment(assignmentId, { sessionId, groupId } = {}) {
    const studentId = requireStudentId();
    if (!sessionId) {
      throw new Error("sessionId is required to book an assessment");
    }
    return studentBookingServiceReal.createBooking(
      assignmentId,
      { studentId, sessionId, groupId },
      undefined
    );
  }
}

export const studentService = new StudentService();
