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
  },
  {
    title: "Import Students",
    icon: "fas fa-upload",
    href: "/admin/users",
    color: "green",
    description: "Upload CSV data",
  },
  {
    title: "Invite Examiner",
    icon: "fas fa-user-plus",
    href: "/admin/users",
    color: "purple",
    description: "Add assessment team",
  },
  {
    title: "Export Results",
    icon: "fas fa-download",
    href: "/admin/assignments",
    color: "indigo",
    description: "Download to Canvas",
  },
  {
    title: "View Reports",
    icon: "fas fa-chart-bar",
    href: "/admin/assignments",
    color: "orange",
    description: "Analytics dashboard",
  },
  {
    title: "Settings",
    icon: "fas fa-cog",
    href: "/admin/settings",
    color: "gray",
    description: "Course preferences",
  },
];

const colorStyles = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  purple: "text-purple-600 dark:text-purple-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  orange: "text-orange-600 dark:text-orange-400",
  gray: "text-gray-600 dark:text-gray-400",
};

export function QuickActions() {
  return (
    <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <button className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group btn-hover-scale">
                <i
                  className={`${action.icon} ${
                    colorStyles[action.color]
                  } text-xl mb-2 group-hover:scale-110 transition-transform`}
                ></i>
                <span className="text-xs text-gray-700 dark:text-gray-300 text-center font-medium">
                  {action.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {action.description}
                </span>
              </button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
