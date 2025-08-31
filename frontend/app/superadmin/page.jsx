"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { AdminManagementHub } from "../../components/superadmin/dashboard/AdminManagementHub";
import { CourseOverviewTable } from "../../components/superadmin/dashboard/CourseOverviewTable";
import { superadminCourseService } from "../../services/superadminCourseService";

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dynamic stats from API
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalAdmins: 12, // 暂时保持硬编码，待后续API完善
    pendingInvitations: 2, // 暂时保持硬编码，待后续API完善
    totalStudents: 0,
    totalAssignments: 0,
    systemHealth: "excellent",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted (client-side) before fetching data
  useEffect(() => {
    setIsMounted(true);
    fetchSuperAdminStats();
  }, []);

  const fetchSuperAdminStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // SuperAdmin获取全局统计数据（不传adminUserId参数）
      const result = await superadminCourseService.getCourseStats();
      
      if (result.success && result.data) {
        setStats(prev => ({
          ...prev,
          totalCourses: result.data.totalCourses || 0,
          activeCourses: result.data.activeCourses || 0,
          totalStudents: result.data.totalStudents || 0,
          totalAssignments: result.data.totalAssignments || 0,
        }));
      } else {
        setError(result.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching SuperAdmin stats:', error);
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        No recent activity
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
