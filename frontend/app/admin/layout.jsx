'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { AdminTopNav } from '../../components/layout/AdminTopNav';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Don't apply the main admin layout to onboarding pages
  if (pathname?.includes('/onboarding')) {
    return children;
  }
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Top header */}
        <AdminTopNav onSidebarToggle={toggleSidebar} />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
          {/* Only show default header for dashboard page */}
          {pathname === '/admin' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Administrator Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back! Here's what's happening with your assignments today.
                </p>
              </div>
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}
