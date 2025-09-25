"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "../../store/authStore";
import { useGlobalSearchStore } from "@/store/globalSearchStore";

/**
 * ExaminerTopNav Component
 * 
 * Top navigation bar for the Examiner dashboard interface.
 * Provides search functionality, dark mode toggle, and user profile menu.
 */
export function ExaminerTopNav({ onSidebarToggle }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { user, smartLogout } = useAuthStore();
  const setSearchOpen = useGlobalSearchStore((state) => state.setOpen);
  const setSearchQuery = useGlobalSearchStore((state) => state.setQuery);

  const displayName = (() => {
    if (!user) return "Examiner";
    return user.name?.trim()
      || user.username?.trim()
      || user.email?.split("@")[0]
      || "Examiner";
  })();

  const displayInitial = displayName?.trim()?.charAt(0)?.toUpperCase() || "E";

  const roleLabel = (() => {
    if (!user?.role) return "Examiner";
    switch (user.role) {
      case "EXAMINER":
        return "Examiner";
      case "COURSE_ADMIN":
        return "Course Admin";
      case "SUPER_ADMIN":
        return "Super Admin";
      case "STUDENT":
        return "Student";
      default:
        return user.role;
    }
  })();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark");
  };

  const handleSearchOpen = useCallback(() => {
    setSearchQuery("");
    setSearchOpen(true);
  }, [setSearchOpen, setSearchQuery]);

  return (
    <header className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 z-40 flex items-center justify-between px-4 md:px-6">
      {/* Left side - Mobile menu toggle and search */}
      <div className="flex items-center">
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          onClick={onSidebarToggle}
          aria-label="Open sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>

        {/* Global search trigger */}
        <div className="ml-4 md:ml-0 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </span>
          <button
            type="button"
            onClick={handleSearchOpen}
            className="w-48 md:w-72 pl-10 pr-12 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-left"
            aria-label="Open global search"
          >
            <span className="text-gray-500 dark:text-gray-400">Search timeslots, assessments...</span>
            <span className="absolute inset-y-0 right-3 hidden md:flex items-center text-xs text-gray-400 dark:text-gray-500">⌘K</span>
          </button>
        </div>
      </div>

      {/* Right side - user profile */}
      <div className="flex items-center space-x-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle dark mode"
        >
          <i
            className={`fas ${
              darkMode ? "fa-sun text-yellow-400" : "fa-moon text-gray-600"
            }`}
          ></i>
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {displayInitial}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {roleLabel}
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
                  href="/examiner/profile"
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
    </header>
  );
}
