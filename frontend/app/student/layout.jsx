"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { StudentSidebar } from "../../components/layout/StudentSidebar";
import { StudentTopNav } from "../../components/layout/StudentTopNav";

/**
 * Calculate current semester based on the current date
 * Feb-July: Semester 1
 * Aug-Nov: Semester 2
 * Dec-Jan: Summer Term
 */
function getCurrentSemester() {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
  const year = now.getFullYear();

  if (month >= 2 && month <= 7) {
    return `${year} Semester 1`;
  } else if (month >= 8 && month <= 11) {
    return `${year} Semester 2`;
  } else {
    // December (12) or January (1)
    const semesterYear = month === 12 ? year + 1 : year;
    return `${semesterYear} Summer Term`;
  }
}

/**
 * StudentLayout Component
 *
 * Provides the main layout structure for all student pages.
 * Includes sidebar navigation, top navigation bar, and main content area.
 * Handles responsive design with mobile sidebar toggle functionality.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in main content area
 */
export default function StudentLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't apply the main student layout to onboarding pages
  if (pathname?.includes("/onboarding")) {
    return children;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <StudentSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Top header */}
        <StudentTopNav onSidebarToggle={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
          {/* Only show default header for dashboard page */}
          {pathname === "/student" && (
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Student Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back! Here's what's happening with your assessments.
                </p>
              </div>

              {/* Current semester info */}
              <div className="mt-4 md:mt-0 px-4 py-2 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg text-sm text-blue-800 dark:text-blue-200 font-medium">
                <i className="fas fa-calendar-alt mr-2"></i>
                Current: {getCurrentSemester()}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
