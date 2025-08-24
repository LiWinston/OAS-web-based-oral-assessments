"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SuperAdminSidebar } from "../../components/layout/SuperAdminSidebar";
import { SuperAdminTopNav } from "../../components/layout/SuperAdminTopNav";

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <SuperAdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Top header */}
        <SuperAdminTopNav onSidebarToggle={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Page title and breadcrumbs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                <i className="fas fa-shield-alt text-orange-500 mr-3"></i>
                Super Administrator
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                System-wide oversight and course administrator management
              </p>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
