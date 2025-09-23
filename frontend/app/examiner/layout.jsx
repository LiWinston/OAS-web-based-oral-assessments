'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ExaminerSidebar } from '../../components/layout/ExaminerSidebar';
import { ExaminerTopNav } from '../../components/layout/ExaminerTopNav';
import GlobalSearchProvider from '../../components/layout/GlobalSearchProvider';
import { GlobalSearchPalette } from '../../components/layout/GlobalSearchPalette';
import '@/search/sources/examiner';

/**
 * ExaminerLayout Component
 * 
 * Provides the main layout structure for all examiner pages.
 * Includes sidebar navigation, top navigation bar, and main content area.
 * Handles responsive design with mobile sidebar toggle functionality.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in main content area
 */
export default function ExaminerLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <GlobalSearchProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <ExaminerSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
          {/* Top header */}
          <ExaminerTopNav onSidebarToggle={toggleSidebar} />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
            {/* Only show default header for dashboard page */}
            {pathname === '/examiner' && (
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Examiner Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Welcome back! Here's what's happening with your assessments today.
                  </p>
                </div>
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
      <GlobalSearchPalette />
    </GlobalSearchProvider>
  );
}
