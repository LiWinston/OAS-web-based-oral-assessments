"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import ResultsHubAssignmentRow from "@/components/admin/results/ResultsHubAssignmentRow.jsx";
import ResultsHubCoursePicker from "@/components/admin/results/ResultsHubCoursePicker.jsx";
import useAdminAssignments from "@/hooks/admin/useAdminAssignments.js";

const STORAGE_KEY = "oas.admin.resultsHub.selectedCourse";

const toCourseKey = (course) => {
  if (!course) return "";
  const value = course.id ?? course.courseId ?? course.subjectId;
  return value !== undefined && value !== null ? String(value) : "";
};

const toAssignmentCourseKey = (assignment) => {
  const value = assignment?.courseId ?? assignment?.subjectId ?? assignment?.course?.id;
  return value !== undefined && value !== null ? String(value) : "";
};

function AssignmentsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-gray-100 dark:bg-gray-800/40"
        />
      ))}
    </div>
  );
}

export default function AdminResultsHubPage() {
  const { user } = useAuthStore();
  const adminId = user?.id;

  const { assignments, courses, loading, error, warnings, refresh } = useAdminAssignments(adminId, {
    enabled: Boolean(adminId),
  });

  const [selectedCourseKey, setSelectedCourseKey] = useState("");
  const [isStorageBootstrapped, setIsStorageBootstrapped] = useState(false);

  // Bootstrap stored course selection
  useEffect(() => {
    if (isStorageBootstrapped) return;
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedCourseKey(stored);
    }
    setIsStorageBootstrapped(true);
  }, [isStorageBootstrapped]);

  // Ensure we always have a valid course selected once courses load
  useEffect(() => {
    if (!courses || courses.length === 0) {
      setSelectedCourseKey("");
      return;
    }

    const hasSelected = courses.some((course) => toCourseKey(course) === selectedCourseKey);

    if (!hasSelected) {
      setSelectedCourseKey(toCourseKey(courses[0]));
    }
  }, [courses, selectedCourseKey]);

  // Persist selection
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedCourseKey) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, selectedCourseKey);
  }, [selectedCourseKey]);

  const selectedCourse = useMemo(
    () => courses.find((course) => toCourseKey(course) === selectedCourseKey),
    [courses, selectedCourseKey]
  );

  const visibleAssignments = useMemo(
    () => assignments.filter((assignment) => toAssignmentCourseKey(assignment) === selectedCourseKey),
    [assignments, selectedCourseKey]
  );

  const courseStats = useMemo(() => {
    const assignmentTotal = visibleAssignments.length;
    const released = visibleAssignments.filter(
      (item) =>
        item?.resultsReleased ||
        item?.results?.released ||
        item?.resultStatus === "RELEASED"
    ).length;
    const pending = assignmentTotal - released;

    return {
      assignmentTotal,
      released,
      pending,
    };
  }, [visibleAssignments]);

  const warningMessage = useMemo(() => {
    if (!warnings || warnings.length === 0) return "";
    return `Could not load assignments for: ${warnings.join(", ")}`;
  }, [warnings]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300" aria-label="Breadcrumb">
          <Link href="/admin" className="font-semibold text-blue-600">
            OAS
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Dashboard
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="font-semibold text-blue-600">Results Hub</span>
        </nav>
      </div>

      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-7 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="text-xs uppercase tracking-[0.3em] text-blue-100/90">Results Consolidation</div>
            <h1 className="text-3xl font-bold">Monitor marking progress & release results confidently</h1>
            <p className="text-sm text-blue-100/80 leading-relaxed">
              Switch between your courses, review assessment readiness at a glance, and jump straight into
              consolidation workflows when pending submissions need attention.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[240px]">
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-blue-100/80">Assignments</div>
              <div className="text-2xl font-bold">
                {courseStats.assignmentTotal ?? 0}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-blue-100/80">Released</div>
              <div className="text-2xl font-bold text-emerald-200">
                {courseStats.released ?? 0}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-blue-100/80">Pending</div>
              <div className="text-2xl font-bold text-amber-100">
                {courseStats.pending ?? 0}
              </div>
            </div>
          </div>
        </div>
      </section>

      {(error || warningMessage) && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <i className="fas fa-exclamation-triangle mt-0.5" />
            <div>
              {error && <div>{error}</div>}
              {warningMessage && <div>{warningMessage}</div>}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <aside className="space-y-4">
          <ResultsHubCoursePicker
            courses={courses}
            assignments={assignments}
            selectedCourseKey={selectedCourseKey}
            onSelectCourse={setSelectedCourseKey}
            onRefresh={refresh}
            loading={loading}
          />
          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-700/60 dark:bg-blue-900/20 dark:text-blue-100">
            <div className="flex items-start gap-2">
              <i className="fas fa-info-circle mt-0.5" />
              <p>
                Need assignment context? Configure workflows from the course
                <Link href={selectedCourse ? `/admin/courses/${toCourseKey(selectedCourse)}/assignments` : "/admin/courses"} className="mx-1 font-semibold underline">
                  Assignment Configuration
                </Link>
                page before consolidating results.
              </p>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {selectedCourse?.courseName || "Select a course"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track examiner submissions, consolidate marks, and release feedback.
              </p>
            </div>
            {selectedCourse && (
              <Button asChild variant="ghost" className="text-blue-600 hover:text-blue-500">
                <Link href={`/admin/courses/${toCourseKey(selectedCourse)}/assignments`}>
                  <i className="fas fa-cog" />
                  Manage Assignment Setup
                </Link>
              </Button>
            )}
          </div>

          {loading && visibleAssignments.length === 0 ? (
            <AssignmentsSkeleton />
          ) : visibleAssignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                <i className="fas fa-chart-line" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No results workflows yet</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create an assignment or finish configuring sessions to begin mark consolidation and release.
              </p>
              {selectedCourse && (
                <Button asChild className="mt-4">
                  <Link href={`/admin/courses/${toCourseKey(selectedCourse)}/assignments`}>
                    Start Assignment Setup
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleAssignments.map((assignment) => (
                <ResultsHubAssignmentRow
                  key={assignment.id ?? assignment.assignmentId}
                  courseId={selectedCourseKey}
                  assignment={assignment}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
