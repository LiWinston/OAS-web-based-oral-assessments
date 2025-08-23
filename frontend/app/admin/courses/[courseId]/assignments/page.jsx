"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../../../../store/authStore";
import { Button } from "../../../../../components/ui/button";
import { AssignmentOverviewStats } from "../../../../../components/admin/assignments/AssignmentOverviewStats";
import { AssignmentList } from "../../../../../components/admin/assignments/AssignmentList";
import { AssignmentCreationModal } from "../../../../../components/admin/assignments/AssignmentCreationModal";
import { EditAssignmentModal } from "../../../../../components/admin/assignments/EditAssignmentModal";
import { WelcomeAnimation } from "../../../../../components/ui/welcome-animation";
import { courseService } from "../../../../../services/courseService";
import { useNotification } from "../../../../../hooks/useNotification";

export default function CourseAssignmentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const { showNotification } = useNotification();

  // Get courseId from params
  const courseId = params.courseId;

  // State management
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // 'table' or 'card'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);

  // Fetch course details
  useEffect(() => {
    fetchCourseDetails();

    // Ensure welcome animation doesn't get stuck
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 3000);

    return () => clearTimeout(welcomeTimer);
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const result = await courseService.getCourses();
      if (result.success && result.data.length > 0) {
        // Find the course by ID
        const foundCourse = result.data.find(
          (c) => c.id.toString() === courseId
        );
        if (foundCourse) {
          setCourse(foundCourse);
        } else {
          showNotification("error", "Course not found");
          router.push("/admin/courses");
        }
      }
    } catch (error) {
      showNotification("error", "Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment creation
  const handleCreateAssignment = () => {
    setIsCreateModalOpen(true);
  };

  const handleAssignmentCreated = (assignment) => {
    showNotification("success", "Assignment created successfully!");
    setIsCreateModalOpen(false);
    // Refresh the assignment list (handled by child component)
  };

  // Handle assignment editing
  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleAssignmentUpdated = (assignment) => {
    showNotification("success", "Assignment updated successfully!");
    setIsEditModalOpen(false);
    setSelectedAssignment(null);
    // Refresh the assignment list (handled by child component)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <i className="fas fa-spinner text-4xl text-blue-600"></i>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading assignments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Animation using reusable component */}
      {showWelcomeAnimation && (
        <WelcomeAnimation
          title="Assignment Configuration"
          subtitle="Create and manage your oral assessments"
          icon="fa-tasks"
          onComplete={() => setShowWelcomeAnimation(false)}
        />
      )}

      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <Link
                href="/admin"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">
                  OAS
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Dashboard
                </span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <Link
                href="/admin/courses"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  My Courses
                </span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <Link
                href="/admin/courses"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {course?.courseCode || "Course"}
                </span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Assignments
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Page Header with Course Info */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <i className="fas fa-tasks mr-3"></i>
              Assignment Configuration
            </h1>
            <div className="flex items-center space-x-4 text-blue-100">
              <span className="flex items-center">
                <i className="fas fa-book mr-2"></i>
                {course?.courseName || "Course"}
              </span>
              <span className="flex items-center">
                <i className="fas fa-code mr-2"></i>
                {course?.courseCode || "CODE"}
              </span>
              <span className="flex items-center">
                <i className="fas fa-calendar mr-2"></i>
                {course?.academicYear || "2025"} •{" "}
                {course?.semester || "Semester"}
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            <Button
              onClick={handleCreateAssignment}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <i className="fas fa-plus"></i>
              <span>New Assignment</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Assignment Statistics */}
      <AssignmentOverviewStats courseId={parseInt(courseId)} />

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center mr-3 flex-shrink-0">
            <i className="fas fa-lightbulb text-amber-600 dark:text-amber-400"></i>
          </div>
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
              Quick Tips
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Create assignments with clear names and descriptions for better
                student understanding
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Configure rubrics before scheduling to ensure consistent
                assessment criteria
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Upload student data via CSV to quickly populate participant
                lists
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Assignment List Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
          <div className="flex items-center space-x-2 mb-3 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mr-4">
              Assignments
            </h2>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-all duration-200
                  ${
                    viewMode === "table"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                `}
              >
                <i className="fas fa-list mr-1"></i> Table
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-all duration-200
                  ${
                    viewMode === "card"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                `}
              >
                <i className="fas fa-th-large mr-1"></i> Cards
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </span>
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2 transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 py-2 px-3 transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment List */}
        <AssignmentList
          courseId={parseInt(courseId)}
          viewMode={viewMode}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onCreateAssignment={handleCreateAssignment}
          onEditAssignment={handleEditAssignment}
        />
      </div>

      {/* Assignment Creation Modal */}
      <AssignmentCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAssignmentCreated={handleAssignmentCreated}
        courseId={parseInt(courseId)}
        courseName={course?.courseName}
        courseCode={course?.courseCode}
        courseSemester={`${course?.academicYear} ${course?.semester}`}
      />

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAssignment(null);
        }}
        onAssignmentUpdated={handleAssignmentUpdated}
        assignment={selectedAssignment}
      />
    </div>
  );
}
