"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

// Mock data for now - will be replaced with real API calls
const mockAssignments = [
  {
    id: 1,
    name: "Data Structures Final Oral",
    type: "Individual",
    status: "Setup",
    nextAction: "Configure Rubric",
    nextActionHref: "/admin/assignments/1/rubric",
    dueDate: "2025-06-15",
    progress: 25,
    participants: 45,
    examiners: 2,
  },
  {
    id: 2,
    name: "Algorithms Group Presentation",
    type: "Group",
    status: "Scheduling",
    nextAction: "Create Time Slots",
    nextActionHref: "/admin/assignments/2/timeslots",
    dueDate: "2025-06-20",
    progress: 60,
    participants: 24,
    examiners: 3,
  },
  {
    id: 3,
    name: "Software Engineering Viva",
    type: "Mixed",
    status: "Live",
    nextAction: "Monitor Bookings",
    nextActionHref: "/admin/assignments/3",
    dueDate: "2025-06-10",
    progress: 85,
    participants: 38,
    examiners: 4,
  },
];

const statusStyles = {
  Setup:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Scheduling: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Results:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Completed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export function AssignmentStatusTable() {
  return (
    <Card className="dashboard-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Assignment Status Overview
          </CardTitle>
          <Link href="/admin/courses">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Next Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {mockAssignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {assignment.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {assignment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        statusStyles[assignment.status]
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${assignment.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[3rem]">
                        {assignment.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {assignment.participants} students
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {assignment.examiners} examiners
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={assignment.nextActionHref}>
                      <Button variant="outline" size="sm">
                        {assignment.nextAction}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mockAssignments.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <i className="fas fa-clipboard-list text-4xl mb-2"></i>
              <p>No assignments created yet</p>
            </div>
            <Link href="/admin/courses">
              <Button>Create Your First Course</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
