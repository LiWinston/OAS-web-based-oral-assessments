"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

/**
 * Mock data for pending feedback items
 */
const mockPendingFeedback = [
  {
    id: 1,
    title: "Project Proposal Presentation",
    course: "COMP90082",
    group: "Group #10",
    assessmentDate: "2025-04-08",
    dueDate: "today",
    scoringProgress: 70,
    status: "overdue",
  },
  {
    id: 2,
    title: "Mid-Semester Project Update",
    course: "INFO30005",
    group: "Group #3",
    assessmentDate: "2025-04-10",
    dueDate: "today",
    scoringProgress: 100,
    status: "overdue",
  },
  {
    id: 3,
    title: "Database Design Review",
    course: "INFO20003",
    group: "Individual - Sarah Chen",
    assessmentDate: "2025-04-11",
    dueDate: "tomorrow",
    scoringProgress: 45,
    status: "pending",
  },
  {
    id: 4,
    title: "System Architecture Presentation",
    course: "COMP90082",
    group: "Group #7",
    assessmentDate: "2025-04-12",
    dueDate: "in 2 days",
    scoringProgress: 0,
    status: "pending",
  },
];

/**
 * Status styling configuration for feedback urgency badges
 */
const statusStyles = {
  overdue: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  pending:
    "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
};

/**
 * PendingFeedback Component
 * 
 * Displays a prioritized list of assessments requiring feedback completion or submission.
 * Emphasizes urgent items with visual indicators and provides quick access to complete
 * feedback for each assessment.
 */
export function PendingFeedback() {
  const overdueCount = mockPendingFeedback.filter(
    (item) => item.status === "overdue"
  ).length;

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mr-2"></i>{" "}
            Pending Feedback
          </CardTitle>
          <div className="text-sm text-red-600 dark:text-red-400">
            {overdueCount} due today
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {mockPendingFeedback.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="md:flex md:justify-between md:items-center">
                <div className="mb-3 md:mb-0">
                  <div className="flex items-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mr-2 ${
                        statusStyles[item.status]
                      }`}
                    >
                      {item.status === "overdue" ? "Due Today" : "Pending"}
                    </span>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.course} - {item.group}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center text-sm">
                    <i className="fas fa-calendar-alt text-gray-400 mr-2"></i>
                    <span>
                      Assessment Date:{" "}
                      {new Date(item.assessmentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-chart-pie text-gray-400 mr-2"></i>
                    <span>Scoring completed: {item.scoringProgress}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Link href="/examiner/assessment">
                  <Button
                    size="sm"
                    className={`${
                      item.status === "overdue"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Complete Feedback
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* More button */}
        <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/examiner/results"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View all {mockPendingFeedback.length} pending feedback items
          </Link>
        </div>

        {mockPendingFeedback.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <i className="fas fa-check-circle text-4xl mb-2 text-green-500"></i>
              <p>All feedback is up to date!</p>
            </div>
            <Link href="/examiner/results">
              <Button variant="outline">View Results</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
