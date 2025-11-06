'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

// Navigation structure for Course Admin sidebar
const navigationItems = [
  {
    section: 'MAIN',
    items: [
      { href: '/admin', icon: 'fas fa-tachometer-alt', label: 'Dashboard', exact: true },
      { href: '/admin/courses', icon: 'fas fa-book', label: 'Courses' },
      { href: '/admin/users', icon: 'fas fa-users', label: 'Users' }
    ]
  },
  {
    section: 'CONFIGURATION',
    items: [
      { href: '/admin/reports', icon: 'fas fa-chart-pie', label: 'Reports' },
      { href: '/admin/results', icon: 'fas fa-chart-bar', label: 'Results' }
    ]
  },
  {
    section: 'HELP',
    items: [
      { href: '/admin/documentation', icon: 'fas fa-book-open', label: 'Documentation' },
    ]
  }
];

/**
 * Admin Sidebar Component
 * 
 * Navigation sidebar for Course Administrators.
 * Features collapsible sections, active state highlighting,
 * and responsive design with mobile overlay.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether sidebar is open (mobile)
 * @param {Function} props.onToggle - Toggle sidebar visibility
 */
export function AdminSidebar({ isOpen, onToggle }) {
  const pathname = usePathname();
  const { user, smartLogout } = useAuthStore();

  const isActive = (href, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out z-50 md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:shadow-none border-r border-gray-200 dark:border-gray-700`}
      >
        {/* Logo and system name */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">OAS</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Admin</span>
          </div>
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="py-4 flex-1 overflow-y-auto">
          {navigationItems.map((section) => (
            <div key={section.section} className="mb-6">
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                {section.section}
              </div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link block px-4 py-2 text-sm rounded-md mx-2 transition-colors ${
                    isActive(item.href, item.exact)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Version info */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 text-xs text-gray-500 dark:text-gray-400">
            Oral Assessment System v1.2.0
          </div>
        </div>
      </aside>
    </>
  );
}
