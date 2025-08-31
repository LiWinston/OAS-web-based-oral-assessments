"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

/**
 * StudentQuickActions Component
 *
 * Displays a grid of quick action buttons for common student tasks
 * like booking assessments, viewing groups, checking results, etc.
 */
export function StudentQuickActions() {
  const quickActions = [
    {
      title: "Book Assessment",
      icon: "fas fa-calendar-plus",
      href: "/student/booking",
      color: "blue",
      description: "Schedule your oral assessment",
    },
    {
      title: "View Groups",
      icon: "fas fa-users",
      href: "/student/groups",
      color: "green",
      description: "Manage group memberships",
    },
    {
      title: "View Results",
      icon: "fas fa-chart-bar",
      href: "/student/results",
      color: "purple",
      description: "Check assessment results",
    },
    {
      title: "Help Center",
      icon: "fas fa-question-circle",
      href: "/student/help",
      color: "yellow",
      description: "Get help and support",
    },
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
        icon: "text-blue-600 dark:text-blue-400",
        text: "text-blue-700 dark:text-blue-300",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
        icon: "text-green-600 dark:text-green-400",
        text: "text-green-700 dark:text-green-300",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
        icon: "text-purple-600 dark:text-purple-400",
        text: "text-purple-700 dark:text-purple-300",
      },
      yellow: {
        bg: "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
        icon: "text-yellow-600 dark:text-yellow-400",
        text: "text-yellow-700 dark:text-yellow-300",
      },
    };
    return colorMap[color] || colorMap.blue;
  };

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
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const colors = getColorClasses(action.color);
            return (
              <Link key={index} href={action.href}>
                <div
                  className={`
                  flex flex-col items-center p-4 rounded-lg transition-all duration-200 
                  transform hover:scale-105 hover:shadow-md cursor-pointer
                  ${colors.bg}
                `}
                >
                  <i
                    className={`${action.icon} ${colors.icon} text-2xl mb-3`}
                  ></i>
                  <span
                    className={`text-sm font-medium ${colors.text} text-center mb-1`}
                  >
                    {action.title}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {action.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
