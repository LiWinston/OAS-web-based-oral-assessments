import { useCallback, useEffect, useRef, useState } from "react";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";

const DEFAULT_STATE = {
  assignments: [],
  courses: [],
  loading: false,
  error: "",
  warnings: [],
};

export function useAdminAssignments(adminId, options = {}) {
  const { enabled = true, limitCourses } = options;
  const [assignments, setAssignments] = useState(DEFAULT_STATE.assignments);
  const [courses, setCourses] = useState(DEFAULT_STATE.courses);
  const [loading, setLoading] = useState(DEFAULT_STATE.loading);
  const [error, setError] = useState(DEFAULT_STATE.error);
  const [warnings, setWarnings] = useState(DEFAULT_STATE.warnings);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!enabled) {
      if (mountedRef.current) {
        setAssignments([]);
        setCourses([]);
        setError("");
        setWarnings([]);
      }
      return;
    }

    if (!adminId) {
      if (mountedRef.current) {
        setAssignments([]);
        setCourses([]);
        setError("");
        setWarnings([]);
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      setError("");
      setWarnings([]);
    }

    try {
      const courseResponse = await courseService.getAllCourses({
        adminUserId: adminId,
      });

      if (!courseResponse?.success) {
        throw new Error(
          courseResponse?.message || "Failed to load course information"
        );
      }

      let courseList = Array.isArray(courseResponse?.data?.data)
        ? courseResponse.data.data
        : [];

      if (typeof limitCourses === "number" && limitCourses > 0) {
        courseList = courseList.slice(0, limitCourses);
      }

      if (mountedRef.current) {
        setCourses(courseList);
      }

      if (courseList.length === 0) {
        if (mountedRef.current) {
          setAssignments([]);
        }
        return;
      }

      const assignmentResults = await Promise.all(
        courseList.map(async (course) => {
          try {
            const response = await assignmentService.getAssignments(course.id);
            return { course, response };
          } catch (error) {
            return {
              course,
              response: {
                success: false,
                message: error?.message,
              },
            };
          }
        })
      );

      const aggregated = [];
      const failedCourses = [];

      assignmentResults.forEach(({ course, response }) => {
        if (response?.success && Array.isArray(response.data)) {
          response.data.forEach((assignment) => {
            aggregated.push({
              ...assignment,
              courseId: course.id,
              courseCode: course.courseCode,
              courseName: course.courseName,
            });
          });
        } else {
          failedCourses.push(
            course.courseCode || course.courseName || String(course.id)
          );
        }
      });

      if (mountedRef.current) {
        setAssignments(aggregated);
        setWarnings(failedCourses);
      }
    } catch (err) {
      if (mountedRef.current) {
        setAssignments([]);
        setCourses([]);
        setError(err?.message || "Failed to load assignments");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [adminId, enabled, limitCourses]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    courses,
    loading,
    error,
    warnings,
    refresh: fetchAssignments,
  };
}

export default useAdminAssignments;
