"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { CourseDetailModal } from "./CourseDetailModal";
import { superadminCourseService } from "../../../services/superadminCourseService";
import Pagination from "../../ui/Pagination";

export function CourseOverviewTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [hasError, setHasError] = useState(false);
  
  // 课程统计状态
  const [courseStats, setCourseStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalDepartments: 0,
    totalAssignments: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNext: false,
    hasPrev: false
  });

  // 防抖搜索
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // 防抖搜索效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 构建筛选参数
  const buildFilters = useCallback(() => {
    const filters = {};
    
    if (debouncedSearchTerm) {
      filters.search = debouncedSearchTerm;
    }
    
    if (filterDepartment !== "all") {
      filters.department = filterDepartment;
    }
    
    if (filterStatus !== "all") {
      filters.status = filterStatus;
    }
    
    return filters;
  }, [debouncedSearchTerm, filterDepartment, filterStatus]);

  // 初始加载
  useEffect(() => {
    // 初始加载逻辑将在 loadCourses 定义后处理
  }, []);

  // 当筛选条件改变时，重新加载数据
  useEffect(() => {
    setCurrentPage(1); // 重置到第一页
    // 筛选逻辑将在 loadCourses 定义后处理
  }, [debouncedSearchTerm, filterDepartment, filterStatus, pageSize]);

  // 处理分页变化
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    loadCourses(newPage, pageSize);
  };

  // 处理页面大小变化
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 重置到第一页
    loadCourses(1, newPageSize);
  };

  // 应用筛选（重置到第一页并重新加载）
  const applyFilters = () => {
    setCurrentPage(1);
    loadCourses(1, pageSize);
  };

  // 清除所有筛选
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterDepartment("all");
    setFilterStatus("all");
    setCurrentPage(1);
    setHasError(false); // 重置错误状态
    // 不需要手动调用 loadCourses，useEffect 会自动触发
  };

  // 加载课程数据（支持筛选和分页）
  const loadCourses = useCallback(async (page = 1, size = pageSize) => {
    try {
      setIsLoading(true);
      const filters = buildFilters();
      
      console.log("=== LOAD COURSES DEBUG ===");
      console.log("Filters:", filters);
      console.log("Page:", page);
      console.log("PageSize:", size);
      console.log("=== END DEBUG ===");
      
      const response = await superadminCourseService.getCourses(filters, page, size);
      
      if (response.success) {
        setCourses(response.data || []);
        setFilteredCourses(response.data || []);
        setHasError(false); // 重置错误状态
        
        // 更新分页信息
        if (response.pagination) {
          setPagination(response.pagination);
          setCurrentPage(response.pagination.currentPage || page);
        }
      } else {
        // API failed, set empty data
        setCourses([]);
        setFilteredCourses([]);
        setHasError(true); // 设置错误状态
        setPagination({
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: size,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      // API error, set empty data
      setCourses([]);
      setFilteredCourses([]);
      setHasError(true); // 设置错误状态
      setPagination({
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: pageSize,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, buildFilters]);

  // 加载课程统计数据
  const loadCourseStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      console.log("=== LOAD COURSE STATS DEBUG ===");
      console.log("Calling superadminCourseService.getCourseStats()");
      
      const response = await superadminCourseService.getCourseStats();
      
      console.log("Response from getCourseStats:", response);
      console.log("Response.success:", response.success);
      console.log("Response.data:", response.data);
      
      if (response.success) {
        const statsData = response.data || {
          totalCourses: 0,
          activeCourses: 0,
          totalStudents: 0,
          totalDepartments: 0,
          totalAssignments: 0
        };
        
        console.log("Setting courseStats to:", statsData);
        setCourseStats(statsData);
      } else {
        console.log("API failed, setting default values");
        // API failed, set default values
        setCourseStats({
          totalCourses: 0,
          activeCourses: 0,
          totalStudents: 0,
          totalDepartments: 0,
          totalAssignments: 0
        });
      }
    } catch (error) {
      console.error("Failed to load course stats:", error);
      // API error, set default values
      setCourseStats({
        totalCourses: 0,
        activeCourses: 0,
        totalStudents: 0,
        totalDepartments: 0,
        totalAssignments: 0
      });
    } finally {
      setStatsLoading(false);
      console.log("=== END LOAD COURSE STATS DEBUG ===");
    }
  }, []);

  // 在 loadCourses 定义后，处理初始加载和筛选变化
  useEffect(() => {
    loadCourses(1, pageSize);
    loadCourseStats(); // 同时加载课程统计
  }, [loadCourses, loadCourseStats]);

  // 当筛选条件改变时，重新加载数据
  useEffect(() => {
    if (loadCourses) {
      setCurrentPage(1); // 重置到第一页
      loadCourses(1, pageSize);
    }
  }, [debouncedSearchTerm, filterDepartment, filterStatus, pageSize, loadCourses]);

  // Get unique departments from courses
  const departments =
    courses && courses.length > 0
      ? [...new Set(courses.map((course) => course.department))]
      : [];

  // 前端筛选逻辑已移除，现在由后端处理

  const getStatusBadge = (status) => {
    // Debug: Log the status value being processed
    console.log("=== STATUS BADGE DEBUG ===");
    console.log("Status value:", status);
    console.log("Status type:", typeof status);
    console.log("Status length:", status ? status.length : "N/A");
    console.log("=== END STATUS BADGE DEBUG ===");

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
        pulse: true,
      },
      setup: { 
        color:
          "bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-300 dark:border-yellow-700",
        icon: "fas fa-cog fa-spin",
        text: "Setup",
        pulse: false,
      },
      inactive: { 
        color:
          "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-300 dark:border-gray-700",
        icon: "fas fa-pause-circle",
        text: "Inactive",
        pulse: false,
      },
      archived: {
        color:
          "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 dark:border-red-700",
        icon: "fas fa-archive",
        text: "Archived",
        pulse: false,
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
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md ${
          config.color
        } ${config.pulse ? "animate-pulse" : ""}`}
      >
        <i className={`${config.icon} mr-2`}></i>
        {config.text}
      </span>
    );
  };

  const handleCourseClick = (course) => {
    if (!course || !course.id) {
      console.warn("Invalid course data for detail view");
      return;
    }
    setSelectedCourse(course);
    setIsDetailModalOpen(true);
  };

  const getAdminAvatar = (adminName) => {
    if (!adminName || typeof adminName !== "string") {
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-md">
          <i className="fas fa-user text-white text-sm"></i>
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
        className={`w-10 h-10 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-110`}
      >
        <span className="text-white text-sm font-semibold">{initials}</span>
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            System-wide Course Overview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading course data...
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-orange-500 mb-4"></i>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Loading course data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state only if there's a real error (not just no search results)
  if (hasError && (!courses || courses.length === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            System-wide Course Overview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No course data available
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Unable to load course data
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Please check your connection and try again
            </p>
            <Button
              onClick={() => loadCourses(1, pageSize)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <i className="fas fa-redo mr-2"></i>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          System-wide Course Overview
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Read-only view of all courses across the platform
        </p>
      </div>

      {/* Enhanced Filters and Search */}
      <Card className="p-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-orange-100 dark:border-orange-900/30">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Enhanced Search */}
          <div className="flex-1">
            <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200"></i>
              <Input
                placeholder="Search courses, codes, or administrators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 dark:focus:border-orange-400 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-lg h-12"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
          
          {/* Enhanced Department filter - same width and height */}
          <div className="w-44">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-orange-500 dark:focus:border-orange-400 shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-lg h-12"
            >
              <option value="all">All Departments</option>
              {departments.map((dept, index) => (
                <option key={dept || `dept-${index}`} value={dept || ""}>
                  {dept || "Unknown"}
                </option>
              ))}
            </select>
          </div>
          
          {/* Enhanced Status filter - same width and height */}
          <div className="w-44">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-orange-500 dark:focus:border-orange-400 shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-lg h-12"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          
          {/* Enhanced Export button - exactly same width and height */}
          <div className="w-44">
            <Button 
              variant="outline" 
              className="w-full px-4 py-3 border-2 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 hover:shadow-md rounded-xl text-sm h-12"
            >
              <i className="fas fa-download mr-2"></i>
              Export Report
            </Button>
          </div>
        </div>
        
        {/* Enhanced Results count with filter indicators */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {filteredCourses.length}
            </span>{" "}
            of <span className="font-semibold">{pagination.totalItems}</span> courses
          </div>
          
          {/* Active filter indicators */}
          <div className="flex items-center space-x-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                <i className="fas fa-search mr-1"></i>"{searchTerm}"
              </span>
            )}
            {filterDepartment !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                <i className="fas fa-building mr-1"></i>
                {filterDepartment}
              </span>
            )}
            {filterStatus !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <i className="fas fa-circle mr-1"></i>
                {filterStatus}
              </span>
            )}
            {(searchTerm ||
              filterDepartment !== "all" ||
              filterStatus !== "all") && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <i className="fas fa-times mr-1"></i>
                Clear all
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Course Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Administrator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCourses.map((course, index) => (
                <tr 
                  key={course?.id || `course-${index}`}
                  className="group hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-900/10 dark:hover:to-red-900/10 transition-all duration-300 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800"
                  onClick={() => handleCourseClick(course)}
                  data-course-id={course?.id || `course-${index}`}
                >
                  <td className="px-6 py-6">
                    <div className="group-hover:translate-x-1 transition-transform duration-300">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-900 dark:group-hover:text-orange-100 transition-colors duration-200">
                        {course.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-medium">
                          {course.code || "N/A"}
                        </span>{" "}
                        • {course.semester || "N/A"}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {course.venue || "TBD"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mr-2 shadow-sm"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {course.department}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center group-hover:translate-x-1 transition-transform duration-300">
                      {getAdminAvatar(course.admin)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {course.admin || "Unassigned"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {course.adminEmail || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <i className="fas fa-user-graduate text-purple-600 dark:text-purple-400 text-sm"></i>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {course.students || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <i className="fas fa-clipboard-list text-blue-600 dark:text-blue-400 text-sm"></i>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {course.assignments || 0} total
                        </div>
                        {(course.activeAssignments || 0) > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                            <i className="fas fa-play-circle mr-1"></i>
                            {course.activeAssignments || 0} active
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="group-hover:scale-105 transition-transform duration-200">
                      {getStatusBadge(course.status)}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {course.lastActivity || "No activity"}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center">
                      <i className="fas fa-clock mr-1"></i>
                      {course.completionRate || 0}% complete
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No courses found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No courses match your current search criteria
              </p>
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
              >
                <i className="fas fa-undo mr-2"></i>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {pagination.totalItems > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Debug: Log courseStats state */}
        {console.log("=== RENDER DEBUG ===")}
        {console.log("courseStats:", courseStats)}
        {console.log("statsLoading:", statsLoading)}
        {console.log("courseStats.totalCourses:", courseStats.totalCourses)}
        {console.log("courseStats.activeCourses:", courseStats.activeCourses)}
        {console.log("courseStats.totalAssignments:", courseStats.totalAssignments)}
        {console.log("=== END RENDER DEBUG ===")}
        
        <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <i className="fas fa-university text-white text-lg"></i>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {statsLoading ? (
              <div className="animate-pulse bg-blue-300 dark:bg-blue-600 h-8 w-16 rounded"></div>
            ) : (
              courseStats.totalCourses.toLocaleString()
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Courses
          </div>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <i className="fas fa-check-circle text-white text-lg"></i>
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
            {statsLoading ? (
              <div className="animate-pulse bg-green-300 dark:bg-green-600 h-8 w-16 rounded"></div>
            ) : (
              courseStats.activeCourses.toLocaleString()
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Active Courses
          </div>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <i className="fas fa-user-graduate text-white text-lg"></i>
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {statsLoading ? (
              <div className="animate-pulse bg-purple-300 dark:bg-purple-600 h-8 w-16 rounded"></div>
            ) : (
              courseStats.totalStudents.toLocaleString()
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Students
          </div>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <i className="fas fa-clipboard-list text-white text-lg"></i>
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
            {statsLoading ? (
              <div className="animate-pulse bg-orange-300 dark:bg-orange-600 h-8 w-16 rounded"></div>
            ) : (
              courseStats.totalAssignments.toLocaleString()
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Assignments
          </div>
        </Card>
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
}
