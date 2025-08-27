'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../ui/button';
import { courseService } from '../../../services/courseService';

export function CourseList({ viewMode, searchTerm, yearFilter, statusFilter, onCreateCourse, onEditCourse, onRefresh }) {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loading, setLoading] = useState(true);

  // Define colors for courses
  const courseColors = useMemo(() => ['blue', 'indigo', 'yellow', 'green', 'purple'], []);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await courseService.getCourses();
      
      if (result.success) {
        // Map the data to the expected format and add colors
        const mappedCourses = result.data.map((course, index) => ({
          id: course.id,
          name: course.courseName,
          code: course.courseCode,
          year: course.academicYear,
          semester: `Semester ${course.semester}`,
          description: course.description,
          students: course.students,
          assignments: course.assignments,
          status: course.status,
          color: courseColors[index % courseColors.length]
        }));
        setCourses(mappedCourses);
        setFilteredCourses(mappedCourses);
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

  // Filter courses based on search and filters with smooth transitions
  useEffect(() => {
    setIsFiltering(true);
    
    // Add a small delay to show filtering animation
    const filterTimeout = setTimeout(() => {
      let filtered = courses;

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(course => 
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Year filter
      if (yearFilter) {
        filtered = filtered.filter(course => course.year.toString() === yearFilter);
      }

      // Status filter  
      if (statusFilter) {
        filtered = filtered.filter(course => course.status === statusFilter);
      }

      setFilteredCourses(filtered);
      setIsFiltering(false);
    }, 300);

    return () => clearTimeout(filterTimeout);
  }, [courses, searchTerm, yearFilter, statusFilter]);

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
    const baseClasses = "px-2 py-1 text-xs rounded-full";
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

  // Table View
  if (viewMode === 'table') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code / Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {course.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {course.semester}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.code}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {course.year}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {course.students} students
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {course.assignments} assignments
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(course.status)}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/courses/${course.id}/assignments`}
                        className="group relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:scale-110"
                        title="Manage Assignments"
                      >
                        <i className="fas fa-tasks text-sm"></i>
                        {/* Enhanced tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Manage Assignments
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </Link>
                      <button
                        onClick={() => onEditCourse(course)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-all duration-200 hover:scale-110"
                        title="Edit Course"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                        title="More Options"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{filteredCourses.length}</span> courses
          </span>
          <div className="flex justify-end space-x-2">
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm disabled:opacity-50"
              disabled
            >
              <i className="fas fa-chevron-left mr-1"></i> Previous
            </button>
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm disabled:opacity-50"
              disabled
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
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 transition-all duration-500 ${isFiltering ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Show loading shimmer when filtering */}
      {isFiltering && (
        <div className="col-span-full flex justify-center items-center py-8">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-2 text-sm font-medium">Filtering courses...</span>
          </div>
        </div>
      )}
      
      {/* No results found state */}
      {!isFiltering && filteredCourses.length === 0 && (
        <div className="col-span-full text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-search text-gray-400 text-xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No courses found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search terms or filters
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {!isFiltering && filteredCourses.map((course, index) => (
        <div 
          key={course.id} 
          className={`course-card bg-white dark:bg-gray-800 rounded-lg shadow group relative animate-fadeInUp ${hoveredCourse === course.id ? 'hovered' : ''}`}
          style={{ 
            animationDelay: `${index * 100}ms`
          }}
          onMouseEnter={() => setHoveredCourse(course.id)}
          onMouseLeave={() => setHoveredCourse(null)}
        >
          <div className={`p-1 ${getColorClasses(course.color)} rounded-t-lg relative overflow-hidden`}>
            {/* Sparkle effect on color bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
          </div>
          <div className="p-5 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {course.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {course.code}
                </span>
              </div>
              <span className={getStatusBadge(course.status)}>
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm group/item">
                <i className="fas fa-calendar-alt text-gray-400 w-5 group-hover/item:text-blue-500 transition-colors duration-300 group-hover:animate-wiggle"></i>
                <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                  {course.year} · {course.semester}
                </span>
              </div>
              <div className="flex items-center text-sm group/item">
                <i className="fas fa-graduation-cap text-gray-400 w-5 group-hover/item:text-green-500 transition-colors duration-300 group-hover:animate-wiggle" style={{ animationDelay: '0.1s' }}></i>
                <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                  {course.assignments} assignments
                </span>
              </div>
              <div className="flex items-center text-sm group/item">
                <i className="fas fa-users text-gray-400 w-5 group-hover/item:text-purple-500 transition-colors duration-300 group-hover:animate-wiggle" style={{ animationDelay: '0.2s' }}></i>
                <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                  {course.students} students
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <div className="flex space-x-3">
                <button 
                  onClick={() => onEditCourse(course)}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105"
                >
                  <i className="fas fa-edit mr-1"></i> Edit
                </button>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/admin/courses/${course.id}/assignments`}
                  className="group relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:scale-110"
                  title="Manage Assignments"
                >
                  <i className="fas fa-tasks text-sm"></i>
                  {/* Enhanced tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Manage Assignments
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </Link>
                <button
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  title="More Options"
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Create New Course Card - Enhanced with animations */}
      {!isFiltering && (
        <div
          className="create-course-card bg-white dark:bg-gray-800 rounded-lg shadow border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-500 group hover:shadow-xl hover:transform hover:-translate-y-2 animate-fadeInUp"
          onClick={onCreateCourse}
          style={{ 
            animationDelay: `${filteredCourses.length * 100}ms`
          }}
        >
        <div className="text-center p-8">
          <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
            <i className="fas fa-plus text-blue-600 dark:text-blue-400 text-lg group-hover:scale-125 transition-all duration-300"></i>
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