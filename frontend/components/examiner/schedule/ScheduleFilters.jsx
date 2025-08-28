"use client";
import React from 'react';
import useScheduleFilterStore from '@/store/scheduleFilterStore';

export default function ScheduleFilters({ courseOptions = [] }) {
  const {
    selectedCourse,
    assessmentType,
    searchText,
    setSelectedCourse,
    setAssessmentType,
    setSearchText,
  } = useScheduleFilterStore();

  return (
    <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
      {/* Course Filter */}
      <div className="relative">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i className="fas fa-filter"></i>
          </span>
          <select
            className="form-control pl-10 pr-10 py-2 appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courseOptions.map((course) => (
              <option key={course.code} value={course.code}>
                {course.code} - {course.name.length > 30 ? course.name.substring(0, 30) + '…' : course.name}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <i className="fas fa-chevron-down"></i>
          </span>
        </div>
      </div>

      {/* Assessment Type */}
      <div className="relative">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i className="fas fa-users"></i>
          </span>
          <select
            className="form-control pl-10 pr-10 py-2 appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="GROUP">Group</option>
            <option value="MIX">Mix</option>
          </select>
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <i className="fas fa-chevron-down"></i>
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex items-center">
          <span className="absolute left-3 text-gray-400">
            <i className="fas fa-search"></i>
          </span>
          <input
            type="text"
            className="form-control pl-10 py-2"
            placeholder="Search assignments, courses, participants"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
