'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../components/ui/button';
import { CourseOverviewStats } from '../../../components/admin/courses/CourseOverviewStats';
import { CourseList } from '../../../components/admin/courses/CourseList';
import { CourseCreationModal } from '../../../components/admin/courses/CourseCreationModal';
import { EditCourseModal } from '../../../components/admin/courses/EditCourseModal';

export default function CoursesPage() {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleCreateCourse = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleCourseCreated = (courseData) => {
    // Handle successful course creation
    console.log('Course created:', courseData);
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
    console.log('Course updated:', updatedCourse);
    setEditModalOpen(false);
    setSelectedCourse(null);
    // TODO: Refresh course list, show success notification
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <Link
                href="/admin"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">OAS</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">Dashboard</span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <Link
                href="/admin/courses"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="text-sm text-gray-600 dark:text-gray-300">My Courses</span>
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

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Course Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and manage courses for the Oral Assessment System
          </p>
        </div>

        <div className="mt-4 md:mt-0">
          <Button 
            onClick={handleCreateCourse}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <i className="fas fa-plus"></i>
            <span>New Course</span>
          </Button>
        </div>
      </div>

      {/* Course Overview Statistics */}
      <CourseOverviewStats />

      {/* Course Filters and View Toggle */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
          <div className="flex items-center space-x-2 mb-3 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mr-4">
              Your Courses
            </h2>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-list mr-1"></i> Table
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'card' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-th-large mr-1"></i> Cards
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </span>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 px-3 py-2"
              />
            </div>

            {/* Year Filter */}
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="appearance-none rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8 py-2 px-3"
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

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8 py-2 px-3"
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