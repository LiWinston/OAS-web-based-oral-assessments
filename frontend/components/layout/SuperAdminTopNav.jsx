'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export function SuperAdminTopNav({ onSidebarToggle }) {
  const [darkMode, setDarkMode] = useState(false);
  const { user, smartLogout } = useAuthStore();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="lg:hidden"
        >
          <i className="fas fa-bars"></i>
        </Button>

        {/* Page context - empty for dashboard, will be populated by specific pages */}
        <div className="flex-1 lg:ml-0"></div>

        {/* Right side - User info and logout */}
        <div className="flex items-center space-x-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Toggle dark mode"
          >
            <i className={`fas ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon text-gray-600 dark:text-gray-400'}`}></i>
          </button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <i className="fas fa-bell text-gray-500 dark:text-gray-400"></i>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <a
              href="/superadmin/profile"
              className="hidden sm:flex flex-col items-end pr-2 hover:opacity-90"
              title="Profile"
            >
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.username || user?.email?.split('@')[0] || 'Super Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                System Administrator
              </p>
            </a>
            
            <a href="/superadmin/profile" className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center" title="Profile">
              <i className="fas fa-user-shield text-white text-sm"></i>
            </a>
            
            <Button 
              onClick={smartLogout} 
              variant="outline" 
              size="sm"
              className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}