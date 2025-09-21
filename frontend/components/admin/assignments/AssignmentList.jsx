"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { assignmentService } from "../../../services/assignmentService";
import { useNotification } from "../../../hooks/useNotification";

function Tooltip({ children, show, x, y }) {
  if (!show) return null;
  
  return createPortal(
    <div 
      className="fixed px-2 py-1 bg-gray-900 text-white text-xs rounded pointer-events-none whitespace-nowrap z-[9999] animate-fade-in"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%) translateY(-8px)'
      }}
    >
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>,
    document.body
  );
}

export function AssignmentList({
  assignments,
  loading,
  viewMode,
  searchTerm,
  statusFilter,
  onCreateAssignment,
  onEditAssignment,
  onAssignmentDeleted,
}) {
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [hoveredAssignment, setHoveredAssignment] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const [isFiltering, setIsFiltering] = useState(false);
  const { showNotification } = useNotification();

  // Filter assignments with smooth transitions
  useEffect(() => {
    setIsFiltering(true);

    // Add a small delay to show filtering animation
    const filterTimeout = setTimeout(() => {
      let filtered = assignments || [];

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(
          (assignment) =>
            assignment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
      }

      // Status filter
      if (statusFilter) {
        filtered = filtered.filter(
          (assignment) => assignment.status === statusFilter
        );
      }

      setFilteredAssignments(filtered);
      setIsFiltering(false);
    }, 300);

    return () => clearTimeout(filterTimeout);
  }, [assignments, searchTerm, statusFilter]);

  // Handle delete
  const handleDelete = async (assignmentId) => {
    try {
      const result = await assignmentService.deleteAssignment(assignmentId);
      if (result.success) {
        showNotification("success", "Assignment deleted successfully");
        // Notify parent component to refresh data
        if (onAssignmentDeleted) {
          onAssignmentDeleted();
        }
      }
    } catch (error) {
      showNotification("error", "Failed to delete assignment");
    }
    setShowDeleteConfirm(null);
  };

  // Get assignment type styles with enhanced colors
  const getTypeStyles = (type) => {
    switch (type) {
      case "individual":
        return {
          bgColor: "bg-indigo-100 dark:bg-indigo-900/50",
          textColor: "text-indigo-700 dark:text-indigo-300",
          borderColor: "border-indigo-500",
          gradientColor: "from-indigo-500 to-blue-600",
          icon: "fa-user",
        };
      case "group":
        return {
          bgColor: "bg-pink-100 dark:bg-pink-900/50",
          textColor: "text-pink-700 dark:text-pink-300",
          borderColor: "border-pink-500",
          gradientColor: "from-pink-500 to-rose-600",
          icon: "fa-users",
        };
      case "mixed":
        return {
          bgColor: "bg-teal-100 dark:bg-teal-900/50",
          textColor: "text-teal-700 dark:text-teal-300",
          borderColor: "border-teal-500",
          gradientColor: "from-teal-500 to-cyan-600",
          icon: "fa-layer-group",
        };
      case "Project":
        return {
          bgColor: "bg-blue-100 dark:bg-blue-900/50",
          textColor: "text-blue-700 dark:text-blue-300",
          borderColor: "border-blue-500",
          gradientColor: "from-blue-500 to-indigo-600",
          icon: "fa-project-diagram",
        };
      case "Challenge":
        return {
          bgColor: "bg-orange-100 dark:bg-orange-900/50",
          textColor: "text-orange-700 dark:text-orange-300",
          borderColor: "border-orange-500",
          gradientColor: "from-orange-500 to-red-600",
          icon: "fa-trophy",
        };
      default:
        return {
          bgColor: "bg-gray-100 dark:bg-gray-900/50",
          textColor: "text-gray-700 dark:text-gray-300",
          borderColor: "border-gray-500",
          gradientColor: "from-gray-500 to-gray-600",
          icon: "fa-tasks",
        };
    }
  };

  // Get status styles
  const getStatusStyles = (status) => {
    switch (status) {
      case "PENDING":
        return {
          bgColor: "bg-blue-100 dark:bg-blue-900/50",
          textColor: "text-blue-700 dark:text-blue-300",
          icon: "fa-clock",
        };
      case "IN_PROGRESS":
        return {
          bgColor: "bg-green-100 dark:bg-green-900/50",
          textColor: "text-green-700 dark:text-green-300",
          icon: "fa-play-circle",
        };
      case "COMPLETED":
        return {
          bgColor: "bg-gray-100 dark:bg-gray-900/50",
          textColor: "text-gray-700 dark:text-gray-300",
          icon: "fa-check-circle",
        };
      default:
        return {
          bgColor: "bg-amber-100 dark:bg-amber-900/50",
          textColor: "text-amber-700 dark:text-amber-300",
          icon: "fa-question",
        };
    }
  };

  const getProgressPercentage = (assignment) => {
    // Prefer explicit numeric progress if backend provides it
    if (typeof assignment?.progress === 'number') {
      return Math.round(assignment.progress);
    }

    // Otherwise derive from three setup steps per client feedback
    const hasRubric = Boolean(
      assignment?.hasRubric ||
        assignment?.rubricConfigured ||
        assignment?.rubricStatus === 'CONFIGURED'
    );
    const hasTimeSlots = Boolean(
      assignment?.hasTimeSlots ||
        assignment?.timeSlotsConfigured ||
        assignment?.scheduleConfigured ||
        assignment?.schedule?.configured
    );
    const resultsReleased = Boolean(
      assignment?.resultsReleased ||
        assignment?.results?.released ||
        assignment?.resultStatus === 'RELEASED'
    );

    const completed = [hasRubric, hasTimeSlots, resultsReleased].filter(Boolean)
      .length;
    if (completed === 3) return 100;
    if (completed === 2) return 66; // 33% increments rounded
    if (completed === 1) return 33;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">
          <i className="fas fa-spinner text-3xl text-blue-600"></i>
        </div>
      </div>
    );
  }

  if (filteredAssignments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-tasks text-blue-600 dark:text-blue-400 text-2xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {assignments.length === 0
            ? "No assignments yet"
            : "No assignments found"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {assignments.length === 0
            ? "Get started by creating your first assignment for this course."
            : "Try adjusting your search or filters."}
        </p>
        {assignments.length === 0 && (
          <button
            onClick={onCreateAssignment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center transition-colors transform hover:scale-105 btn-magic"
          >
            <i className="fas fa-plus mr-2"></i> Create First Assignment
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <Tooltip show={tooltip.show} x={tooltip.x} y={tooltip.y}>
        {tooltip.text}
      </Tooltip>
      {viewMode === "table" ? (
        // Enhanced Table View with hover effects
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[280px]">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                    Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[180px]">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[80px]">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssignments.map((assignment, index) => {
                  const typeStyles = getTypeStyles(assignment.type);
                  const statusStyles = getStatusStyles(assignment.status);
                  const progress = getProgressPercentage(assignment);

                  return (
                    <tr
                      key={assignment.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-[1.01]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[320px]">
                            {assignment.name}
                          </div>
                          {assignment.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[320px]">
                              {assignment.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyles.bgColor} ${typeStyles.textColor} transition-all duration-200 hover:scale-105`}
                        >
                          <i className={`fas ${typeStyles.icon} mr-1`}></i>
                          {assignment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          <div className="flex items-center group/item">
                            <i className="fas fa-calendar-alt text-gray-400 mr-2 group-hover/item:text-blue-500 transition-colors duration-300 group-hover:animate-wiggle"></i>
                            <span>
                              {new Date(assignment.startDate).getFullYear()}/{String(new Date(assignment.startDate).getMonth() + 1).padStart(2, '0')}/{String(new Date(assignment.startDate).getDate()).padStart(2, '0')}{" "}
                              -{" "}
                              {new Date(assignment.endDate).getFullYear()}/{String(new Date(assignment.endDate).getMonth() + 1).padStart(2, '0')}/{String(new Date(assignment.endDate).getDate()).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {assignment.weight}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div>
                          <div className="flex items-center justify-center">
                            <div className="flex-1 mr-3 max-w-[80px]">
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full progress-bar-glow ${
                                    progress === 100
                                      ? "bg-gradient-to-r from-green-400 to-green-600"
                                      : progress > 50
                                      ? "bg-gradient-to-r from-blue-400 to-blue-600"
                                      : progress > 0
                                      ? "bg-gradient-to-r from-amber-400 to-amber-600"
                                      : "bg-gray-300"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              {progress}%
                            </span>
                          </div>

                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles.bgColor} ${statusStyles.textColor} transition-all duration-200 hover:scale-105`}
                        >
                          <i className={`fas ${statusStyles.icon} mr-1`}></i>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => onEditAssignment(assignment)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group transform hover:scale-110 cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                show: true,
                                text: 'Edit Assignment',
                                x: rect.left + rect.width / 2,
                                y: rect.top
                              });
                            }}
                            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                          >
                            <i className="fas fa-edit text-blue-600 dark:text-blue-400 group-hover:animate-wiggle"></i>
                          </button>

                          <Link
                            href={`/admin/courses/${assignment.subjectId}/assignments/${assignment.id}/rubric`}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group transform hover:scale-110 ${
                              !assignment.hasRubric ? "animate-pulse" : ""
                            }`}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                show: true,
                                text: 'Configure Rubric',
                                x: rect.left + rect.width / 2,
                                y: rect.top
                              });
                            }}
                            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                          >
                            <i className="fas fa-clipboard-list text-amber-600 dark:text-amber-400 group-hover:animate-wiggle"></i>
                          </Link>

                          <Link
                            href={`/admin/courses/${assignment.subjectId}/assignments/${assignment.id}/timeslots`}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group transform hover:scale-110 ${
                              !assignment.hasTimeSlots ? "animate-pulse" : ""
                            }`}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              show: true,
                              text: 'Schedule Sessions',
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            });
                            }}
                            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                          >
                            <i className="fas fa-calendar-week text-green-600 dark:text-green-400 group-hover:animate-wiggle"></i>
                          </Link>

                          <button
                            onClick={() => setShowDeleteConfirm(assignment.id)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group transform hover:scale-110 cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                show: true,
                                text: 'Delete Assignment',
                                x: rect.left + rect.width / 2,
                                y: rect.top
                              });
                            }}
                            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                          >
                            <i className="fas fa-trash text-red-600 dark:text-red-400 group-hover:animate-wiggle"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Enhanced Card View with Magical Effects
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ${
            isFiltering ? "opacity-50 scale-95" : "opacity-100 scale-100"
          }`}
        >
          {/* Show loading shimmer when filtering */}
          {isFiltering && (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                <div
                  className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <span className="ml-2 text-sm font-medium">
                  Filtering assignments...
                </span>
              </div>
            </div>
          )}

          {!isFiltering &&
            filteredAssignments.map((assignment, index) => {
              const typeStyles = getTypeStyles(assignment.type);
              const statusStyles = getStatusStyles(assignment.status);
              const progress = getProgressPercentage(assignment);
              const studentCount =
                assignment.students ?? assignment.studentCount ?? 0;
              const groupCount = assignment.groups ?? assignment.groupCount ?? 0;

              return (
                <div
                  key={assignment.id}
                  className="course-card bg-white dark:bg-gray-800 rounded-lg shadow group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:transform hover:-translate-y-2 min-h-[400px] flex flex-col"
                  onMouseEnter={() => setHoveredAssignment(assignment.id)}
                  onMouseLeave={() => setHoveredAssignment(null)}
                >
                  {/* Magic gradient border overlay */}
                  <div
                    className={`p-1 bg-gradient-to-r ${typeStyles.gradientColor} rounded-t-lg relative overflow-hidden`}
                  >
                    {/* Sparkle effect on color bar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                  </div>

                  <div className="p-6 relative z-10 flex-1 flex flex-col">
                    {/* Header section */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {assignment.name}
                        </h3>
                        {/* Fixed height container for description to ensure alignment */}
                        <div className="h-[40px] overflow-hidden">
                          {assignment.description ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors overflow-hidden" 
                               style={{
                                 display: '-webkit-box',
                                 WebkitLineClamp: 2,
                                 WebkitBoxOrient: 'vertical',
                                 textOverflow: 'ellipsis'
                               }}>
                              {assignment.description}
                            </p>
                          ) : (
                            <div className="h-[40px]"></div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyles.bgColor} ${typeStyles.textColor} transition-all duration-200 group-hover:scale-105 ml-3 flex-shrink-0`}
                      >
                        <i
                          className={`fas ${typeStyles.icon} mr-1 group-hover:animate-wiggle`}
                        ></i>
                        {assignment.type}
                      </span>
                    </div>

                    {/* Content section */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm group/item">
                        <div className="w-5 flex justify-center mr-2">
                          <i className="fas fa-calendar-alt text-gray-400 group-hover/item:text-blue-500 transition-colors duration-300 group-hover:animate-wiggle"></i>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                          {new Date(assignment.startDate).toLocaleDateString()}{" "}
                          - {new Date(assignment.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center text-sm group/item">
                        <div className="w-5 flex justify-center mr-2">
                          <i
                            className="fas fa-percentage text-gray-400 group-hover/item:text-green-500 transition-colors duration-300 group-hover:animate-wiggle"
                            style={{ animationDelay: "0.1s" }}
                          ></i>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                          {assignment.weight}% of final grade
                        </span>
                      </div>

                      <div className="flex items-center text-sm group/item">
                        <div className="w-5 flex justify-center mr-2">
                          <i
                            className="fas fa-users text-gray-400 group-hover/item:text-purple-500 transition-colors duration-300 group-hover:animate-wiggle"
                            style={{ animationDelay: "0.2s" }}
                          ></i>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                          {studentCount} students
                          {groupCount > 0 && `, ${groupCount} groups`}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles.bgColor} ${statusStyles.textColor} transition-all duration-200 group-hover:scale-105`}
                        >
                          <i
                            className={`fas ${statusStyles.icon} mr-1 group-hover:animate-wiggle`}
                          ></i>
                          {assignment.status}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar with Shimmer */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          Progress
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full relative overflow-hidden ${
                            progress === 100
                              ? "bg-gradient-to-r from-green-400 to-green-600"
                              : progress > 50
                              ? "bg-gradient-to-r from-blue-400 to-blue-600"
                              : progress > 0
                              ? "bg-gradient-to-r from-amber-400 to-amber-600"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${progress}%` }}
                        >
                          {progress > 0 && (
                            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {assignment.completedSessions}/
                        {assignment.totalSessions} sessions completed
                      </div>
                    </div>

                    {/* Configuration Status */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-4 text-xs">
                        {(() => {
                          const hasRubric = Boolean(
                            assignment?.hasRubric ||
                              assignment?.rubricConfigured ||
                              assignment?.rubricStatus === 'CONFIGURED'
                          );
                          const hasTimeSlots = Boolean(
                            assignment?.hasTimeSlots ||
                              assignment?.timeSlotsConfigured ||
                              assignment?.scheduleConfigured ||
                              assignment?.schedule?.configured
                          );
                          const resultsReleased = Boolean(
                            assignment?.resultsReleased ||
                              assignment?.results?.released ||
                              assignment?.resultStatus === 'RELEASED'
                          );

                          return (
                            <>
                              <span
                                className={`flex items-center transition-colors duration-300 ${
                                  hasRubric
                                    ? 'text-green-600'
                                    : 'text-gray-400 group-hover:text-gray-600'
                                }`}
                              >
                                <i
                                  className={`fas ${
                                    hasRubric ? 'fa-check-circle' : 'fa-circle'
                                  } mr-1 group-hover:animate-pulse`}
                                ></i>
                                Rubric
                              </span>
                              <span
                                className={`flex items-center transition-colors duration-300 ${
                                  hasTimeSlots
                                    ? 'text-green-600'
                                    : 'text-gray-400 group-hover:text-gray-600'
                                }`}
                              >
                                <i
                                  className={`fas ${
                                    hasTimeSlots ? 'fa-check-circle' : 'fa-circle'
                                  } mr-1 group-hover:animate-pulse`}
                                ></i>
                                Sessions
                              </span>
                              <span
                                className={`flex items-center transition-colors duration-300 ${
                                  resultsReleased
                                    ? 'text-green-600'
                                    : 'text-gray-400 group-hover:text-gray-600'
                                }`}
                              >
                                <i
                                  className={`fas ${
                                    resultsReleased
                                      ? 'fa-check-circle'
                                      : 'fa-circle'
                                  } mr-1 group-hover:animate-pulse`}
                                ></i>
                                Results
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Flexible spacer to push buttons to bottom */}
                    <div className="flex-1"></div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                      <button
                        onClick={() => onEditAssignment(assignment)}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 transform hover:scale-105 cursor-pointer"
                      >
                        <i className="fas fa-edit mr-1 hover:animate-wiggle"></i>{" "}
                        Edit
                      </button>

                      <div className="flex space-x-3">
                        <Link
                          href={`/admin/courses/${assignment.subjectId}/assignments/${assignment.id}/rubric`}
                          className={`text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 transform hover:scale-110 ${
                            !assignment.hasRubric ? "animate-pulse" : ""
                          }`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              show: true,
                              text: 'Configure Rubric',
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            });
                          }}
                          onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                        >
                          <i className="fas fa-clipboard-list hover:animate-wiggle"></i>
                        </Link>

                        <Link
                          href={`/admin/courses/${assignment.subjectId}/assignments/${assignment.id}/timeslots`}
                          className={`text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 transform hover:scale-110 ${
                            !assignment.hasTimeSlots ? "animate-pulse" : ""
                          }`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              show: true,
                              text: 'Schedule Sessions',
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            });
                          }}
                          onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                        >
                          <i className="fas fa-calendar-week hover:animate-wiggle"></i>
                        </Link>

                        <Link
                          href={`/admin/courses/${assignment.subjectId}/assignments/${assignment.id}/results`}
                          className={`text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 transform hover:scale-110`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              show: true,
                              text: 'Results & Marking',
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            });
                          }}
                          onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                        >
                          <i className="fas fa-chart-bar hover:animate-wiggle"></i>
                        </Link>

                        <button
                          onClick={() => setShowDeleteConfirm(assignment.id)}
                          className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 transform hover:scale-110 cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              show: true,
                              text: 'Delete Assignment',
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            });
                          }}
                          onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                        >
                          <i className="fas fa-trash hover:animate-wiggle"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Create New Assignment Card */}
          {!isFiltering && (
            <div
              className="course-card bg-white dark:bg-gray-800 rounded-lg shadow border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-500 group hover:shadow-xl hover:transform hover:-translate-y-2 min-h-[400px] flex flex-col"
              onClick={onCreateAssignment}
            >
              <div className="text-center p-8">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors duration-300">
                  <i className="fas fa-plus text-blue-600 dark:text-blue-400 text-lg group-hover:scale-110 transition-transform duration-200"></i>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Create New Assignment
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                  Add another oral assessment
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full animate-scaleIn">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mr-3">
                <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Assignment?
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. All assignment data will be
              permanently removed.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
