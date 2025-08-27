"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "../../../store/authStore";
import { Button } from "../../../components/ui/button";
import { CourseOverviewStats } from "../../../components/admin/courses/CourseOverviewStats";
import { CourseList } from "../../../components/admin/courses/CourseList";
import { CourseCreationModal } from "../../../components/admin/courses/CourseCreationModal";
import { EditCourseModal } from "../../../components/admin/courses/EditCourseModal";

export default function CoursesPage() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const courseListRef = useRef();

  // Initialize welcome animation
  useEffect(() => {
    // Ensure welcome animation doesn't get stuck
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 3000);

    return () => clearTimeout(welcomeTimer);
  }, []);

  const handleCreateCourse = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleCourseCreated = (courseData) => {
    // Handle successful course creation
    console.log("Course created:", courseData);
    setIsModalOpen(false);
    // TODO: Refresh course list, show success notification
    // Navigate to assignment configuration if desired
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedCourse(null);
  };

  const handleCourseUpdated = (updatedCourse) => {
    // Handle successful course update
    console.log("Course updated:", updatedCourse);
    setEditModalOpen(false);
    setSelectedCourse(null);
    
    // Refresh course list to show updated data
    if (courseListRef.current) {
      courseListRef.current();
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Animation Overlay - Matching Assignment Page Style */}
      {showWelcomeAnimation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-indigo-900/90 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => setShowWelcomeAnimation(false)}
        >
          <div className="text-center text-white animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <i className="fas fa-graduation-cap text-8xl text-blue-400 animate-bounce-slow"></i>
                <i className="fas fa-sparkles text-2xl text-yellow-300 absolute -top-2 -right-2 animate-pulse"></i>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 animate-slide-up">
              Course Management
            </h1>
            <p className="text-xl opacity-90 animate-slide-up animation-delay-200">
              Create and manage courses for your institution
            </p>
            <p className="text-sm opacity-70 mt-6 animate-fade-in">
              Click anywhere to continue
            </p>
          </div>
        </div>
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
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Course Management
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Enhanced Page Header with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <i className="fas fa-graduation-cap mr-3"></i>
              Course Management
            </h1>
            <p className="text-blue-100">
              Create and manage courses for the Oral Assessment System
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <Button
              onClick={handleCreateCourse}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200 btn-magic"
            >
              <i className="fas fa-plus"></i>
              <span>New Course</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Course Overview Statistics */}
      <CourseOverviewStats />

      {/* Enhanced Quick Tips Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center mr-3 flex-shrink-0">
            <i className="fas fa-lightbulb text-emerald-600 dark:text-emerald-400"></i>
          </div>
          <div>
            <h3 className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">
              Course Management Tips
            </h3>
            <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-emerald-600 mr-2 mt-0.5"></i>
                Set up courses at the beginning of each semester with clear
                naming conventions
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-emerald-600 mr-2 mt-0.5"></i>
                Use descriptive course codes that follow your institution's
                standards
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-emerald-600 mr-2 mt-0.5"></i>
                Add detailed descriptions to help students and examiners
                understand course content
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Course Filters and View Toggle */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
          <div className="flex items-center space-x-2 mb-3 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mr-4">
              Your Courses
            </h2>

            {/* Enhanced View Mode Toggle with Gradient */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-all duration-200 transform hover:scale-105
                  ${
                    viewMode === "table"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                `}
              >
                <i className="fas fa-list mr-1"></i> Table
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-all duration-200 transform hover:scale-105
                  ${
                    viewMode === "card"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }
                `}
              >
                <i className="fas fa-th-large mr-1"></i> Cards
              </button>
            </div>
          </div>

          {/* Enhanced Filters with Hover Effects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Enhanced Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </span>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2 transition-all duration-200 hover:shadow-md"
              />
            </div>

            {/* Enhanced Year Filter */}
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="appearance-none rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 py-2 px-3 transition-all duration-200 hover:shadow-md"
              >
                <option value="">All Years</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>

            {/* Enhanced Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 py-2 px-3 transition-all duration-200 hover:shadow-md"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course List */}
      <CourseList
        viewMode={viewMode}
        searchTerm={searchTerm}
        yearFilter={yearFilter}
        statusFilter={statusFilter}
        onCreateCourse={handleCreateCourse}
        onEditCourse={handleEditCourse}
        onRefresh={courseListRef}
      />

      {/* Course Creation Modal */}
      <CourseCreationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCourseCreated={handleCourseCreated}
      />

      {/* Edit Course Modal */}
      <EditCourseModal
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        onCourseUpdated={handleCourseUpdated}
        course={selectedCourse}
      />
    </div>
  );
}
