"use client";

import { Button } from "../../ui/button";
import { Card } from "../../ui/card";

export function CourseDetailModal({ course, isOpen, onClose }) {
  if (!isOpen || !course) return null;

  const getStatusBadge = (status) => {
    // Debug: Log the status value being processed
    console.log("=== COURSE DETAIL MODAL STATUS DEBUG ===");
    console.log("Status value:", status);
    console.log("Status type:", typeof status);
    console.log("=== END COURSE DETAIL MODAL STATUS DEBUG ===");

    // Handle null, undefined, or empty string
    if (!status || typeof status !== "string" || status.trim() === "") {
      console.log("Status is falsy, defaulting to inactive");
      status = "inactive";
    }

    // Convert to lowercase for case-insensitive comparison
    const normalizedStatus = status.toLowerCase().trim();
    console.log("Normalized status:", normalizedStatus);

    const statusConfig = {
      active: {
        color:
          "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 dark:border-green-700",
        icon: "fas fa-check-circle",
        text: "Active",
      },
      setup: {
        color:
          "bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-300 dark:border-yellow-700",
        icon: "fas fa-cog",
        text: "Setup",
      },
      inactive: {
        color:
          "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-300 dark:border-gray-700",
        icon: "fas fa-pause-circle",
        text: "Inactive",
      },
      archived: {
        color:
          "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 dark:border-red-700",
        icon: "fas fa-archive",
        text: "Archived",
      },
    };

    // Find the matching status config
    let config = statusConfig[normalizedStatus];
    if (!config) {
      console.log(`No config found for status: "${normalizedStatus}", defaulting to inactive`);
      config = statusConfig.inactive;
    }

    console.log("Selected config:", config);

    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${config.color}`}
      >
        <i className={`${config.icon} mr-2`}></i>
        {config.text}
      </span>
    );
  };

  const getAdminAvatar = (adminName) => {
    if (!adminName || typeof adminName !== "string") {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-md">
          <i className="fas fa-user text-white text-lg"></i>
        </div>
      );
    }

    const initials = adminName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    const colors = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-green-400 to-green-600",
      "from-orange-400 to-orange-600",
      "from-pink-400 to-pink-600",
      "from-indigo-400 to-indigo-600",
    ];
    const colorIndex = adminName.length % colors.length;

    return (
      <div
        className={`w-12 h-12 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center shadow-md`}
      >
        <span className="text-white text-lg font-semibold">{initials}</span>
      </div>
    );
  };

  // Use real assignment data from course object, with fallback to empty array
  const assignments = course.assignments || course.assignmentList || [];

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header with X button in top right */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white relative">
          {/* Close button in absolute top right - more visible */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 z-10 shadow-lg"
          >
            <i className="fas fa-times text-gray-700 text-lg"></i>
          </button>

          <div className="flex items-center space-x-4 pr-12">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-university text-2xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{course.name}</h2>
              <p className="text-orange-100 text-lg">
                {course.code} • {course.semester}
              </p>
              <p className="text-orange-200 text-sm">{course.department}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <i className="fas fa-info-circle text-orange-500 mr-2"></i>
                  Course Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {course.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Venue
                      </label>
                      <p className="text-gray-900 dark:text-gray-100 mt-1 flex items-center">
                        <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                        {course.venue}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </label>
                      <div className="mt-2">
                        {getStatusBadge(course.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Assignments */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <i className="fas fa-clipboard-list text-orange-500 mr-2"></i>
                  Assignments ({assignments.length})
                </h3>
                <div className="space-y-3">
                  {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                      <div
                        key={
                          assignment.id ||
                          assignment.assignmentId ||
                          Math.random()
                        }
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {assignment.name ||
                                assignment.assignmentName ||
                                assignment.title ||
                                "Unnamed Assignment"}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {assignment.type ||
                                assignment.assignmentType ||
                                "Individual"}{" "}
                              • Due:{" "}
                              {assignment.dueDate ||
                                assignment.due ||
                                assignment.deadline ||
                                "TBD"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {assignment.completion ||
                                assignment.progress ||
                                0}
                              % complete
                            </div>
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                              <div
                                className="h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    assignment.completion ||
                                    assignment.progress ||
                                    0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center">
                            <i className="fas fa-user-graduate mr-1"></i>
                            {assignment.students ||
                              assignment.studentCount ||
                              0}{" "}
                            students
                          </span>
                          <span className="flex items-center">
                            <i className="fas fa-user-tie mr-1"></i>
                            {assignment.examiners ||
                              assignment.examinerCount ||
                              0}{" "}
                            examiners
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (assignment.status || "Unknown") === "Active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            }`}
                          >
                            {assignment.status || "Unknown"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                      <p>No assignments available for this course</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Admin */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <i className="fas fa-user-shield text-orange-500 mr-2"></i>
                  Course Administrator
                </h3>
                <div className="flex items-center space-x-3">
                  {getAdminAvatar(course.admin)}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {course.admin || "Unassigned"}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {course.adminEmail || "No email available"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Last activity:{" "}
                      {course.lastActivity || "No activity recorded"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Statistics */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <i className="fas fa-chart-bar text-orange-500 mr-2"></i>
                  Course Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Enrolled Students
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {course.students}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Assignments
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {course.assignmentCount || course.assignments || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Active Assignments
                    </span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {course.activeAssignments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Examiners
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {course.examinerCount}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Completion Rate
                      </span>
                      <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                        {course.completionRate}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${course.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <i className="fas fa-bolt text-orange-500 mr-2"></i>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    <i className="fas fa-chart-line mr-2 text-orange-500"></i>
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <i className="fas fa-download mr-2 text-blue-500"></i>
                    Export Report
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <i className="fas fa-envelope mr-2 text-green-500"></i>
                    Contact Admin
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <i className="fas fa-eye mr-2"></i>
              Read-only view • Super Admin access
            </div>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
