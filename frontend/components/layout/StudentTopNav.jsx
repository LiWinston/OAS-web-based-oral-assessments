"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "../../store/authStore";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useGlobalSearchStore } from "@/store/globalSearchStore";

/**
 * Student Top Navigation Component
 *
 * Top navigation bar for student interface including course selector,
 * dark mode toggle and user profile dropdown.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSidebarToggle - Function to toggle sidebar on mobile
 */
export function StudentTopNav({ onSidebarToggle }) {
  const { user, smartLogout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const setSearchOpen = useGlobalSearchStore((state) => state.setOpen);
  const setSearchQuery = useGlobalSearchStore((state) => state.setQuery);

  const handleSearchOpen = useCallback(() => {
    setSearchQuery("");
    setSearchOpen(true);
  }, [setSearchOpen, setSearchQuery]);

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

        {/* Global search trigger */}
        <div className="ml-4 md:ml-0 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </span>
          <button
            type="button"
            onClick={handleSearchOpen}
            className="w-44 md:w-64 pl-10 pr-12 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-left"
            aria-label="Open global search"
          >
            <span className="text-gray-500 dark:text-gray-400">Search bookings, results...</span>
            <span className="absolute inset-y-0 right-3 hidden md:flex items-center text-xs text-gray-400 dark:text-gray-500">⌘K</span>
          </button>
        </div>
      </div>

      {/* Right side - Dark mode, user profile */}
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
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setUserMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}
