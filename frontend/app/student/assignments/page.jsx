'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

/**
 * Student Assignments Page
 * 
 * Displays all student assignments with detailed information
 * and booking capabilities.
 */
export default function StudentAssignments() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            My Assignments
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View and manage your oral assessment assignments
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Assignments Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <i className="fas fa-tasks text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Assignments Page
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This page will show detailed assignment information and booking interface.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
