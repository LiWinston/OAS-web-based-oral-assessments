'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../ui/button';
import { courseService } from '../../../services/courseService';

export function CourseList({ viewMode, searchTerm, yearFilter, statusFilter, onCreateCourse, onEditCourse, onRefresh, onCoursesLoaded }) {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define colors for courses
  const courseColors = useMemo(() => ['blue', 'indigo', 'yellow', 'green', 'purple'], []);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const pageSize = 10;

  const fetchCourses = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const filters = {
        yearFilter: yearFilter || undefined,
        statusFilter: statusFilter || undefined,
        searchTerm: searchTerm || undefined
      };
      
      const result = await courseService.getCourses(page, pageSize, filters);
      
      if (result.success) {
        console.log('API Response:', result);
        
        // Get pagination info
        const { total, current, data: coursesData } = result.data;
        setTotalCourses(total);
        setCurrentPage(current);
        
        // Map the data to the expected format and add colors
        const mappedCourses = coursesData.map((course, index) => ({
          id: course.id,
          courseName: course.courseName,
          courseCode: course.courseCode,
          academicYear: course.academicYear,
          semester: course.semester,
          description: course.description,
          students: course.students,
          assignments: course.assignments,
          status: course.status,
          color: courseColors[index % courseColors.length]
        }));
        
        console.log('Mapped courses:', mappedCourses);
        setCourses(mappedCourses);
        setFilteredCourses(mappedCourses);
        
        // Pass course data to parent component for year generation
        if (onCoursesLoaded) {
          onCoursesLoaded(coursesData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  }, [courseColors]);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch courses when filters change
  useEffect(() => {
    fetchCourses(1); // Reset to first page when filters change
  }, [searchTerm, yearFilter, statusFilter]);

  // Handle course updated (for future use)
  const handleCourseUpdated = (updatedCourse) => {
    setCourses(prev => prev.map(course => 
      course.id === updatedCourse.id ? updatedCourse : course
    ));
    // TODO: Show success notification
  };

  // Expose refresh method to parent component
  useEffect(() => {
    if (onRefresh) {
      onRefresh.current = fetchCourses;
    }
  }, [onRefresh, fetchCourses]);

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    if (status === 'active') {
      return `${baseClasses} bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200`;
    } else {
      return `${baseClasses} bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200`;
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-600",
      indigo: "bg-indigo-600", 
      yellow: "bg-yellow-500",
      green: "bg-green-600",
      purple: "bg-purple-600"
    };
    return colors[color] || "bg-blue-600";
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">
          <i className="fas fa-spinner text-3xl text-blue-600"></i>
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredCourses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-graduation-cap text-blue-600 dark:text-blue-400 text-2xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {courses.length === 0
            ? "No courses yet"
            : "No courses found"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {courses.length === 0
            ? "Get started by creating your first course for assessment."
            : "Try adjusting your search or filters."}
        </p>
        {courses.length === 0 && (
          <button
            onClick={onCreateCourse}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center transition-colors transform hover:scale-105 btn-magic"
          >
            <i className="fas fa-plus mr-2"></i> Create First Course
          </button>
        )}
      </div>
    );
  }

  // Table View
  if (viewMode === 'table') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[320px]">
                  Course
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                  Code
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[80px]">
                  Year
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                  Semester
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCourses.map((course, index) => (
                <tr 
                  key={course.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-[1.01]"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[300px]">
                        {course.courseName}
                      </div>
                      {course.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[300px]">
                          {course.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.courseCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.academicYear}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {course.semester === 'summer' ? 'Summer' : `Semester ${course.semester}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={getStatusBadge(course.status)}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => onEditCourse(course)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group transform hover:scale-110 relative"
                        title="Edit Course"
                      >
                        <i className="fas fa-edit text-blue-600 dark:text-blue-400 group-hover:animate-wiggle"></i>
                        {/* Enhanced tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Edit Course
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </button>
                      <Link
                        href={`/admin/courses/${course.id}/assignments`}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group transform hover:scale-110 relative"
                        title="Manage Assignments"
                      >
                        <i className="fas fa-tasks text-blue-600 dark:text-blue-400 group-hover:animate-wiggle"></i>
                        {/* Enhanced tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Manage Assignments
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCourses)}</span> of <span className="font-medium">{totalCourses}</span> courses
          </span>
          <div className="flex justify-end space-x-2">
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={currentPage === 1}
              onClick={() => fetchCourses(currentPage - 1)}
            >
              <i className="fas fa-chevron-left mr-1"></i> Previous
            </button>
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={currentPage * pageSize >= totalCourses}
              onClick={() => fetchCourses(currentPage + 1)}
            >
              Next <i className="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Card View
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">


      {filteredCourses.map((course, index) => (
        <div 
          key={course.id} 
          className="course-card bg-white dark:bg-gray-800 rounded-lg shadow relative cursor-pointer transition-all duration-500 group hover:shadow-xl hover:transform hover:-translate-y-2"
        >
          <div className={`p-1 ${getColorClasses(course.color)} rounded-t-lg relative overflow-hidden`}>
            {/* Color bar */}
          </div>
          <div className="p-5 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {course.courseName}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-medium">{course.courseCode}</span>
                </div>
                {/* Fixed height container for description to ensure alignment */}
                <div className="h-[48px] overflow-hidden">
                  {course.description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors overflow-hidden leading-relaxed" 
                       style={{
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical'
                       }}>
                      {course.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Click edit to add some description...
                    </p>
                  )}
                </div>
              </div>
              <span className={`${getStatusBadge(course.status)} ml-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm group/item">
                <div className="w-5 flex justify-center mr-2">
                  <i className="fas fa-calendar-alt text-gray-400 group-hover/item:text-blue-500 transition-colors duration-200"></i>
                </div>
                <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors duration-200">
                  {course.academicYear} · {course.semester === 'summer' ? 'Summer' : `Semester ${course.semester}`}
                </span>
              </div>
              <div className="flex items-center text-sm group/item">
                <div className="w-5 flex justify-center mr-2">
                  <i className="fas fa-graduation-cap text-gray-400 group-hover/item:text-green-500 transition-colors duration-200"></i>
                </div>
                <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors duration-200">
                  {course.assignments} assignments
                </span>
              </div>
              <div className="flex items-center text-sm group/item">
                <div className="w-5 flex justify-center mr-2">
                  <i className="fas fa-users text-gray-400 group-hover/item:text-purple-500 transition-colors duration-200"></i>
                </div>
                <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors duration-200">
                  {course.students} students
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <button
                onClick={() => onEditCourse(course)}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 transform hover:scale-105"
              >
                <i className="fas fa-edit mr-1 hover:animate-wiggle"></i> Edit
              </button>

              <div className="flex space-x-3">
                <Link
                  href={`/admin/courses/${course.id}/assignments`}
                  className="group/item text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 transform hover:scale-110 relative"
                  title="Manage Assignments"
                >
                  <i className="fas fa-tasks hover:animate-wiggle"></i>
                  {/* Enhanced tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Manage Assignments
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Create New Course Card - Enhanced with animations */}
      {(
        <div
          className="create-course-card bg-white dark:bg-gray-800 rounded-lg shadow border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-500 group hover:shadow-xl hover:transform hover:-translate-y-2"
          onClick={onCreateCourse}
        >
        <div className="text-center p-8">
          <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors duration-300">
            <i className="fas fa-plus text-blue-600 dark:text-blue-400 text-lg group-hover:scale-110 transition-transform duration-200"></i>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Create New Course
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
            Add a new course for assessment
          </p>
        </div>
        </div>
      )}
    </div>
  );
}