'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';

export function SuperAdminSidebar({ isOpen, onToggle }) {
  const pathname = usePathname();
  
  const navigation = [
    {
      name: 'Dashboard',
      href: '/superadmin',
      icon: 'fas fa-tachometer-alt',
      current: pathname === '/superadmin'
    },
    {
      name: 'Course Admins',
      href: '/superadmin/admins',
      icon: 'fas fa-user-shield',
      current: pathname?.startsWith('/superadmin/admins')
    },
    {
      name: 'All Courses',
      href: '/superadmin/courses',
      icon: 'fas fa-university',
      current: pathname?.startsWith('/superadmin/courses')
    }/*,
    {
      name: 'System Settings',
      href: '/superadmin/settings',
      icon: 'fas fa-cogs',
      current: pathname?.startsWith('/superadmin/settings')
    }*/
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-orange-200 dark:border-orange-800
      `}>
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-orange-500 to-red-500">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-white mr-2">OAS</span>
            <span className="text-sm font-medium text-orange-100">Super Admin</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden text-white hover:bg-orange-600"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${item.current
                    ? 'bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-300 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400'
                  }
                `}
              >
                <i className={`${item.icon} mr-3 text-base ${
                  item.current ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'
                }`}></i>
                {item.name}
                {item.current && (
                  <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Version info */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-orange-200 dark:border-orange-800">
          <div className="p-4 text-xs text-orange-600 dark:text-orange-400">
            Oral Assessment System v1.2.0
          </div>
        </div>
      </div>
    </>
  );
}