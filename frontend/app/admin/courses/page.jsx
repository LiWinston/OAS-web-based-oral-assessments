"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "../../../store/authStore";
import { Button } from "../../../components/ui/button";
import { CourseOverviewStats } from "../../../components/admin/courses/CourseOverviewStats";
import { CourseList } from "../../../components/admin/courses/CourseList";
import { courseService } from "../../../services/courseService";
import { CourseCreationModal } from "../../../components/admin/courses/CourseCreationModal";
import { EditCourseModal } from "../../../components/admin/courses/EditCourseModal";

export default function CoursesPage() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // 'table' or 'card'
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Default to show all courses
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const [availableYears, setAvailableYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const pageSize = 10;
  const courseListRef = useRef();
  
  // Course stats state
  const [courseStats, setCourseStats] = useState({
    activeCourses: 0,
    totalStudents: 0,
    assignments: 0,
    currentSemester: "",
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Fetch courses based on view mode and filters
  const fetchCourses = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const filters = {
        year: yearFilter || undefined,
        semester: undefined,
        status: statusFilter || undefined,
        courseCode: searchTerm || undefined,
        adminUserId: user?.id
      };
      
      console.log('User data:', user);
      console.log('User ID:', user?.id);
      console.log('Filters being sent:', filters);

      let result;
      if (viewMode === 'table') {
        // Paginated query
        console.log('Fetching page:', page, 'with filters:', filters);
        result = await courseService.getCoursesPaginated(page, pageSize, filters);
      } else {
        // Fetch all data
        result = await courseService.getAllCourses(filters);
      }

      console.log('API Response:', result);
      
      if (result.success) {
        const { data } = result;
        // If table view, use the provided page number; otherwise use default
        const { 
          total = 0, 
          current = viewMode === 'table' ? page : 1, 
          data: coursesData = [], 
          size = pageSize 
        } = data;
        
        // Update pagination info
        setTotalCourses(total);
        setCurrentPage(current);
        
        // Set course data (ensure array)
        const coursesList = Array.isArray(coursesData) ? coursesData : [];
        setCourses(coursesList);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  }, [viewMode, yearFilter, statusFilter, searchTerm, user?.id]);

  // Fetch course statistics
  const fetchCourseStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError('');
      
      // Ensure user data is available before making the request
      if (!user?.id) {
        console.warn('User ID not available for course stats request');
        setStatsLoading(false);
        return;
      }
      
      const result = await courseService.getCourseStats(user.id);
      
      if (result.success && result.data) {
        setCourseStats({
          activeCourses: result.data.activeCourses || 0,
          totalStudents: result.data.totalStudents || 0,
          assignments: result.data.totalAssignments || 0,
          currentSemester: result.data.currentSemester || "2025 S2",
        });
      } else {
        setStatsError(result.message || 'Failed to fetch course statistics');
        // Set default values
        setCourseStats({
          activeCourses: 0,
          totalStudents: 0,
          assignments: 0,
          currentSemester: "2025 S2",
        });
      }
    } catch (error) {
      console.error('Error fetching course stats:', error);
      setStatsError('Failed to load course statistics');
      // Set default values
      setCourseStats({
        activeCourses: 0,
        totalStudents: 0,
        assignments: 0,
        currentSemester: "2025 S2",
      });
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  // Initialize stats - only depends on user ID, not filters
  useEffect(() => {
    if (user?.id) {
      fetchCourseStats();
    }
  }, [user?.id, fetchCourseStats]);

  // Fetch courses on init and when filters change - excluding stats
  useEffect(() => {
    // Only fetch courses when user data is loaded
    if (user?.id) {
      fetchCourses(1);
    }
  }, [searchTerm, yearFilter, statusFilter, viewMode, user?.id, fetchCourses]);

  // Initialize courseListRef
  useEffect(() => {
    courseListRef.current = fetchCourses;
  }, [fetchCourses]);

  // Initialize year options
  useEffect(() => {
    const years = generateYearRange();
    setAvailableYears(years);
  }, []);

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

  const handleCourseCreated = async (courseData) => {
    // Handle successful course creation
    console.log("Course created:", courseData);
    setIsModalOpen(false);
    // Directly call fetchCourses to refresh
    await fetchCourses(1);
    
    // Refresh statistics to reflect the new course
    await fetchCourseStats();
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
    
    // Refresh statistics to reflect changes (especially active course count)
    fetchCourseStats();
  };

  // Generate a fixed year range: next year down to 7 years ago
  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 1;
    const minYear = currentYear - 6; // 7 years ago
    const yearRange = [];
    
    for (let year = maxYear; year >= minYear; year--) {
      yearRange.push(year);
    }
    
    return yearRange;
  };





  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Animation Overlay - Matching Assignment Page Style */}
      {showWelcomeAnimation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-indigo-900/90 backdrop-blur-sm animate-fade-in cursor-pointer min-h-screen h-full"
          onClick={() => setShowWelcomeAnimation(false)}
        >
          <div className="text-center text-white max-w-2xl px-8">
            <div className="relative mb-8 animate-scale-in">
              <div className="text-8xl mb-4 relative">
                <i className="fas fa-graduation-cap text-white animate-bounce-slow"></i>
                <div className="absolute -top-4 -left-4 text-2xl">
                  <i className="fas fa-sparkles text-yellow-300 animate-ping"></i>
                </div>
                <div className="absolute -top-2 -right-6 text-xl">
                  <i className="fas fa-star text-yellow-400 animate-ping" style={{ animationDelay: "0.5s" }}></i>
                </div>
                <div className="absolute -bottom-2 -left-6 text-lg">
                  <i className="fas fa-sparkles text-blue-300 animate-ping" style={{ animationDelay: "1s" }}></i>
                </div>
                <div className="absolute -bottom-4 -right-2 text-xl">
                  <i className="fas fa-star text-purple-300 animate-ping" style={{ animationDelay: "1.5s" }}></i>
                </div>
              </div>
            </div>
            <div className="animate-slide-up animation-delay-200">
              <h1 className="text-4xl font-bold mb-4 text-white">Course Management</h1>
              <p className="text-xl text-blue-100 mb-8">Create and manage courses for your institution</p>
              <div className="animate-fade-in animation-delay-500">
                <p className="text-sm text-blue-200 mb-2 flex items-center justify-center">
                  <i className="fas fa-mouse-pointer mr-2 animate-bounce"></i>
                  Click anywhere to continue
                </p>
                <div className="flex justify-center">
                  <div className="w-6 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-white/60 rounded-full animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <nav className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <ol className="flex items-center">
            <li className="flex items-center">
              <Link
                href="/admin"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-3">
                  OAS
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Dashboard
                </span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 ml-2 mr-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 text-sm">
                Courses
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
      <CourseOverviewStats 
        stats={courseStats}
        loading={statsLoading}
        error={statsError}
      />

      {/* Enhanced Quick Tips Section */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center mr-3 flex-shrink-0">
            <i className="fas fa-lightbulb text-amber-600 dark:text-amber-400"></i>
          </div>
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
              Course Management Tips
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Set up courses at the beginning of each semester with clear
                naming conventions
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Use descriptive course codes that follow your institution's
                standards
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-amber-600 mr-2 mt-0.5"></i>
                Add detailed descriptions to help students and examiners
                understand course content
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Course Filters and View Toggle */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mr-4">
                Courses
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
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
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
        courses={courses}
        currentPage={currentPage}
        totalCourses={totalCourses}
        pageSize={pageSize}
        loading={loading}
        onCreateCourse={handleCreateCourse}
        onEditCourse={handleEditCourse}
        onPageChange={(page) => fetchCourses(page)}
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
