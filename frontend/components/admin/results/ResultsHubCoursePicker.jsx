"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function normaliseCourseKey(course) {
  if (!course) return "";
  const value = course.id ?? course.courseId ?? course.subjectId;
  return value !== undefined && value !== null ? String(value) : "";
}

function assignmentMatchesCourse(courseKey, assignment) {
  if (!courseKey) return false;
  const value = assignment?.courseId ?? assignment?.subjectId ?? assignment?.course?.id;
  if (value === undefined || value === null) return false;
  return String(value) === courseKey;
}

function buildAssignmentStats(courseKey, assignments) {
  const relevant = assignments.filter((assignment) => assignmentMatchesCourse(courseKey, assignment));
  const total = relevant.length;
  const pending = relevant.filter((assignment) => {
    const released =
      assignment?.resultsReleased ||
      assignment?.results?.released ||
      assignment?.resultStatus === "RELEASED";
    return !released;
  }).length;

  return {
    total,
    pending,
  };
}

export function ResultsHubCoursePicker({
  courses = [],
  assignments = [],
  selectedCourseKey,
  onSelectCourse,
  onRefresh,
  loading,
}) {
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState(null);

  const trimmedQuery = query.trim().toLowerCase();

  const filteredCourses = useMemo(() => {
    if (!trimmedQuery) return courses;
    return courses.filter((course) => {
      const haystack = [
        course.courseCode,
        course.courseName,
        course.semester,
        course.academicYear,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return haystack.some((value) => value.includes(trimmedQuery));
    });
  }, [courses, trimmedQuery]);

  const selectedCourse = useMemo(
    () => courses.find((course) => normaliseCourseKey(course) === selectedCourseKey),
    [courses, selectedCourseKey]
  );

  const selectedStats = useMemo(
    () => (selectedCourseKey ? buildAssignmentStats(selectedCourseKey, assignments) : { total: 0, pending: 0 }),
    [assignments, selectedCourseKey]
  );

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (filteredCourses.length > 0) {
      const course = filteredCourses[0];
      const key = normaliseCourseKey(course);
      onSelectCourse(key);
      setFeedback({
        type: "success",
        text: `Selected ${course.courseCode || course.courseName || `Course ${course.id || ""}`}`,
      });
    } else if (trimmedQuery) {
      setFeedback({
        type: "warning",
        text: `No courses match “${query}”`,
      });
    }
  };

  const feedbackTone = feedback?.type === "warning"
    ? "text-amber-600 dark:text-amber-400"
    : feedback?.type === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-blue-600 dark:text-blue-400";

  const feedbackIcon = feedback?.type === "warning"
    ? "fas fa-exclamation-triangle"
    : feedback?.type === "success"
      ? "fas fa-check-circle"
      : "fas fa-circle-info";

  useEffect(() => {
    if (!trimmedQuery) {
      if (feedback?.type !== "success") {
        setFeedback(null);
      }
      return;
    }

    if (feedback?.type === "success") return;

    if (filteredCourses.length > 0) {
      setFeedback({
        type: "info",
        text: `Found ${filteredCourses.length} course${filteredCourses.length > 1 ? "s" : ""}`,
      });
    } else {
      setFeedback({ type: "warning", text: `No courses match “${query}”` });
    }
  }, [trimmedQuery, filteredCourses.length, query, feedback?.type]);

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setFeedback(null);
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Course selector</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-500"
          onClick={onRefresh}
          disabled={loading}
        >
          <i className={`fas fa-sync${loading ? " fa-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Search and pick a course to load its assignments and results metrics.
      </p>

      <Input
        value={query}
        onChange={handleInputChange}
        placeholder="Search by code, name, or semester…"
        className="w-full"
        onKeyDown={handleSearchKeyDown}
      />

      {feedback?.text && (
        <div className={`flex items-center gap-2 text-xs ${feedbackTone}`}>
          <i className={feedbackIcon} />
          <span>{feedback.text}</span>
        </div>
      )}

      {courses.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No courses found yet. Create one from
          <Link href="/admin/courses" className="mx-1 font-medium underline">
            Courses
          </Link>
          to begin configuring assessments.
        </div>
      ) : (
        <Select
          value={selectedCourseKey || undefined}
          onValueChange={onSelectCourse}
          disabled={courses.length === 0}
        >
          <SelectTrigger className="w-full justify-between">
            <SelectValue
              placeholder={loading ? "Loading courses…" : "Select a course"}
            >
              {selectedCourse ? (
                <span className="flex flex-col text-left">
                  <span className="text-sm font-semibold">
                    {selectedCourse.courseCode || `Course ${selectedCourse.id || ""}`}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedCourse.courseName || "Untitled course"}
                  </span>
                </span>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72 w-[320px]">
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredCourses.length} of {courses.length}
            </div>
            <SelectSeparator />
            {filteredCourses.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                No courses match “{query}”.
              </div>
            ) : (
              filteredCourses.map((course) => {
                const key = normaliseCourseKey(course);
                const stats = buildAssignmentStats(key, assignments);
                return (
                  <SelectItem key={key} value={key} className="py-2">
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {course.courseCode || `Course ${course.id || ""}`}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {course.courseName || "Untitled course"}
                      </span>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <i className="fas fa-layer-group" />
                          {stats.total} assignments
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <i className="fas fa-hourglass-half text-amber-500" />
                          {stats.pending} pending
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      )}

      <div className="rounded-xl bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/30 px-4 py-3 text-xs text-blue-900 dark:text-blue-100">
        <div className="flex items-center gap-2">
          <i className="fas fa-circle-dot" />
          <div>
            <div className="font-semibold">Selected course summary</div>
            <div className="flex items-center gap-3 mt-1 text-[11px] uppercase tracking-wide">
              <span>Total assignments: {selectedStats.total}</span>
              <span>Pending release: {selectedStats.pending}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsHubCoursePicker;
