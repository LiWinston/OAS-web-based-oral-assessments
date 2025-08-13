'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export function AdminTopNav({ onSidebarToggle }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user, smartLogout } = useAuthStore();

  const mockNotifications = [
    {
      id: 1,
      type: 'warning',
      title: 'Deadline Approaching',
      message: 'Final marks for COMP101 due in 24 hours',
      time: '10 min ago',
      icon: 'fas fa-exclamation-circle',
      color: 'text-red-500'
    },
    {
      id: 2,
      type: 'success',
      title: 'New Examiner Added',
      message: 'Dr. Jane Smith added to BIOL200',
      time: '1 hour ago',
      icon: 'fas fa-user-plus',
      color: 'text-green-500'
    },
    {
      id: 3,
      type: 'info',
      title: 'Schedule Updated',
      message: 'ECON315 assessment schedule modified',
      time: '3 hours ago',
      icon: 'fas fa-calendar-check',
      color: 'text-blue-500'
    }
  ];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark');
  };

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

        {/* Search box */}
        <div className="ml-4 md:ml-0 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </span>
          <input
            type="text"
            placeholder="Search for courses, assignments, students..."
            className="w-48 md:w-72 pl-10 pr-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right side - user profile, notifications, etc. */}
      <div className="flex items-center space-x-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle dark mode"
        >
          <i className={`fas ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon text-gray-600'}`}></i>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none relative"
            aria-label="Notifications"
          >
            <i className="fas fa-bell text-gray-600 dark:text-gray-300"></i>
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full w-4 h-4 text-xs flex items-center justify-center text-white animate-pulse">
              {mockNotifications.length}
            </span>
          </button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-20 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Mark all as read
                  </button>
                </div>

                {mockNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <i className={`${notification.icon} ${notification.color}`}></i>
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
            </>
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
                {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.username || user?.email?.split('@')[0] || 'Admin User'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Course Administrator
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
                  href="/admin/profile"
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