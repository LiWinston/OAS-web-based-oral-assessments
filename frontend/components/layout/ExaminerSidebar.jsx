"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../store/authStore";

/**
 * Navigation structure configuration for the Examiner sidebar
 */
const navigationItems = [
  {
    section: "MAIN",
    items: [
      {
        href: "/examiner",
        icon: "fas fa-tachometer-alt",
        label: "Dashboard",
        exact: true,
      },
      {
        href: "/examiner/schedule",
        icon: "fas fa-calendar-alt",
        label: "Schedule",
      },
      {
        href: "/examiner/assessment",
        icon: "fas fa-clipboard-check",
        label: "Assessment",
      },
      { href: "/examiner/results", icon: "fas fa-chart-bar", label: "Results" },
    ],
  },
  {
    section: "CONFIGURATION",
    items: [
      {
        href: "/examiner/settings",
        icon: "fas fa-cog",
        label: "Settings",
      },
    ],
  },
  {
    section: "HELP",
    items: [
      {
        href: "/examiner/documentation",
        icon: "fas fa-book-open",
        label: "Documentation",
      },
      { href: "/examiner/support", icon: "fas fa-headset", label: "Support" },
    ],
  },
];

/**
 * ExaminerSidebar Component
 *
 * Primary navigation sidebar for the Examiner dashboard interface.
 * Provides hierarchical navigation with sections for main functions, tools, and help.
 */
export function ExaminerSidebar({ isOpen, onToggle }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  /**
   * Determines if a navigation item should be highlighted as active
   */
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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out z-50 md:sticky md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:shadow-none border-r border-gray-200 dark:border-gray-700`}
      >
        {/* Logo and system name */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              OAS
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Examiner
            </span>
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
                  className={`sidebar-link ${
                    isActive(item.href, item.exact)
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700"
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
