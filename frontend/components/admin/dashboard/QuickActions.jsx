"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

const quickActions = [
  {
    title: "New Course",
    icon: "fas fa-plus-circle",
    href: "/admin/courses",
    color: "blue",
    description: "Create new course",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    title: "Import Students",
    icon: "fas fa-upload",
    href: "/admin/users",
    color: "green",
    description: "Upload CSV data",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Invite Examiner",
    icon: "fas fa-user-plus",
    href: "/admin/users",
    color: "purple",
    description: "Add Examiner team",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    title: "Export Results",
    icon: "fas fa-download",
    href: "/admin/assignments",
    color: "indigo",
    description: "Download to Canvas",
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    title: "View Reports",
    icon: "fas fa-chart-bar",
    href: "/admin/assignments",
    color: "orange",
    description: "Analytics dashboard",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    title: "Settings",
    icon: "fas fa-cog",
    href: "/admin/settings",
    color: "gray",
    description: "Course preferences",
    gradient: "from-gray-500 to-gray-600",
  },
];

const colorStyles = {
  blue: {
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
    shadow: "hover:shadow-blue-500/25",
  },
  green: {
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    hover: "hover:bg-green-100 dark:hover:bg-green-900/30",
    shadow: "hover:shadow-green-500/25",
  },
  purple: {
    icon: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    hover: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
    shadow: "hover:shadow-purple-500/25",
  },
  indigo: {
    icon: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900/30",
    shadow: "hover:shadow-indigo-500/25",
  },
  orange: {
    icon: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    hover: "hover:bg-orange-100 dark:hover:bg-orange-900/30",
    shadow: "hover:shadow-orange-500/25",
  },
  gray: {
    icon: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-700",
    hover: "hover:bg-gray-100 dark:hover:bg-gray-600",
    shadow: "hover:shadow-gray-500/25",
  },
};

export function QuickActions() {
  return (
    <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
            <i className="fas fa-bolt text-white text-sm"></i>
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const styles = colorStyles[action.color];
            return (
              <Link key={index} href={action.href}>
                <div
                  className={`
                    group relative p-4 ${styles.bg} rounded-xl flex flex-col items-center justify-center 
                    ${styles.hover} transition-all duration-300 cursor-pointer border border-transparent
                    hover:border-white/50 ${styles.shadow} hover:shadow-lg
                    transform hover:scale-105 hover:-translate-y-1 overflow-hidden
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className={`
                    absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 
                    group-hover:opacity-10 transition-opacity duration-300
                  `}
                  ></div>

                  {/* Sparkle effect */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <i className="fas fa-sparkles text-yellow-400 text-xs animate-pulse"></i>
                  </div>

                  {/* Icon container */}
                  <div className="relative z-10 mb-3">
                    <div
                      className={`
                      w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center
                      group-hover:scale-110 group-hover:rotate-12 transition-all duration-300
                      shadow-lg group-hover:shadow-xl
                    `}
                    >
                      <i
                        className={`${action.icon} ${styles.icon} text-xl group-hover:scale-110 transition-transform duration-300`}
                      ></i>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center relative z-10">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {action.title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      {action.description}
                    </span>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`
                      h-full bg-gradient-to-r ${action.gradient} 
                      transform scale-x-0 group-hover:scale-x-100 
                      transition-transform duration-300 origin-left
                    `}
                    ></div>
                  </div>

                  {/* Hover arrow indicator */}
                  <div className="absolute top-1/2 right-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300">
                    <i
                      className={`fas fa-arrow-right ${styles.icon} text-sm`}
                    ></i>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Enhanced footer with tips */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-info-circle mr-2 text-blue-500"></i>
            <span>Click any action above for quick access to common tasks</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
