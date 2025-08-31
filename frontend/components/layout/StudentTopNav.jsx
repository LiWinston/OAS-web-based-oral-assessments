"use client";

import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useDarkMode } from "../../hooks/useDarkMode";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

/**
 * Student Top Navigation Component
 *
 * Top navigation bar for student interface including course selector,
 * notifications, dark mode toggle, and user profile dropdown.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSidebarToggle - Function to toggle sidebar on mobile
 */
export function StudentTopNav({ onSidebarToggle }) {
  const { user, smartLogout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("all");

  // Mock courses data - will be replaced with real data
  const courses = [
    { id: "all", name: "All Courses" },
    { id: "comp90082", name: "COMP90082 - SPM" },
    { id: "info30005", name: "INFO30005 - Web Info Tech" },
    { id: "comp30022", name: "COMP30022 - IT Project" },
  ];

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: "success",
      icon: "fas fa-calendar-check",
      title: "Booking Confirmed",
      message: "Your SPM Final Presentation is booked for April 15, 10:30 AM",
      time: "10 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "warning",
      icon: "fas fa-exclamation-circle",
      title: "Upcoming Assessment Reminder",
      message: "Web Info Tech presentation tomorrow at 2:00 PM",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      type: "info",
      icon: "fas fa-users",
      title: "Group Assignment Update",
      message: "You've been added to Group 7 for IT Project",
      time: "Yesterday",
      unread: true,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="bg-white dark:bg-gray-800 shadow h-16 z-10 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 dark:border-gray-700">
      {/* Left side - Mobile menu toggle and course selector */}
      <div className="flex items-center">
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          onClick={onSidebarToggle}
          aria-label="Open sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>

        {/* Course selector */}
        <div className="ml-4 md:ml-0">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48 md:w-64">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right side - Dark mode, notifications, user profile */}
      <div className="flex items-center space-x-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <i className="fas fa-sun text-yellow-400"></i>
          ) : (
            <i className="fas fa-moon text-gray-600"></i>
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none relative"
            aria-label="Notifications"
          >
            <i className="fas fa-bell text-gray-600 dark:text-gray-300"></i>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full w-4 h-4 text-xs flex items-center justify-center text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-20 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Mark all as read
                </button>
              </div>

              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 ${
                    notification.unread
                      ? "bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20"
                      : ""
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <i
                        className={`${notification.icon} ${
                          notification.type === "success"
                            ? "text-green-500"
                            : notification.type === "warning"
                            ? "text-yellow-500"
                            : "text-blue-500"
                        }`}
                      ></i>
                    </div>
                    <div className="ml-3 w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="px-4 py-2 text-center">
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {user?.username?.charAt(0)?.toUpperCase() ||
                  user?.email?.charAt(0)?.toUpperCase() ||
                  "S"}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.username || user?.email?.split("@")[0] || "Student"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Student
              </div>
            </div>
            <i className="fas fa-chevron-down text-xs text-gray-500 dark:text-gray-400"></i>
          </button>

          {/* User dropdown menu */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-20 border border-gray-200 dark:border-gray-700">
                <a
                  href="/student/profile"
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <i className="fas fa-user mr-3 text-gray-400"></i>
                  Profile
                </a>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => {
                    setUserMenuOpen(false);
                    smartLogout();
                  }}
                >
                  <i className="fas fa-sign-out-alt mr-3 text-gray-400"></i>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(notificationsOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setNotificationsOpen(false);
            setUserMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}
