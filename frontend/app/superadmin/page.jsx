"use client";

import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { AdminManagementHub } from "../../components/superadmin/dashboard/AdminManagementHub";
import { CourseOverviewTable } from "../../components/superadmin/dashboard/CourseOverviewTable";

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock stats for dashboard cards
  const stats = {
    totalCourses: 28,
    activeCourses: 23,
    totalAdmins: 12,
    pendingInvitations: 2,
    totalStudents: 1847,
    systemHealth: "excellent",
  };

  const tabs = [
    { id: "overview", name: "System Overview", icon: "fas fa-tachometer-alt" },
    { id: "admins", name: "Course Admins", icon: "fas fa-user-shield" },
    { id: "courses", name: "All Courses", icon: "fas fa-university" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section - Synced with Courses Overview Design */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-shield-alt text-orange-500 text-2xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back,{" "}
              {user?.username || user?.email?.split("@")[0] || "Super Admin"}!
            </h1>
            <p className="text-lg text-orange-100 mt-1">
              System-wide oversight and management at your fingertips
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Courses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalCourses}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                <i className="fas fa-arrow-up mr-1"></i>
                {stats.activeCourses} active
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-university text-white"></i>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Course Admins
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalAdmins}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                <i className="fas fa-envelope mr-1"></i>
                {stats.pendingInvitations} invitations sent
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-shield text-white"></i>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalStudents.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                <i className="fas fa-users mr-1"></i>
                Across all courses
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-graduate text-white"></i>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                System Health
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Excellent
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                <i className="fas fa-check-circle mr-1"></i>
                All systems operational
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-heartbeat text-white"></i>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setActiveTab("admins")}
                  className="h-16 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <div className="text-center">
                    <i className="fas fa-user-plus text-xl mb-1 block"></i>
                    <span className="text-sm">Invite Course Admin</span>
                  </div>
                </Button>

                <Button
                  onClick={() => setActiveTab("courses")}
                  variant="outline"
                  className="h-16 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900"
                >
                  <div className="text-center">
                    <i className="fas fa-university text-xl mb-1 block text-blue-500"></i>
                    <span className="text-sm">View All Courses</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-16 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900"
                >
                  <div className="text-center">
                    <i className="fas fa-chart-line text-xl mb-1 block text-green-500"></i>
                    <span className="text-sm">System Reports</span>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent System Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-user-check text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Course Admin registered: Dr. Sarah Chen
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-plus text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        New course created: Advanced Machine Learning
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        1 day ago
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-envelope text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Invitation sent: Prof. James Wilson
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        2 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "admins" && <AdminManagementHub />}
        {activeTab === "courses" && <CourseOverviewTable />}
      </div>
    </div>
  );
}
