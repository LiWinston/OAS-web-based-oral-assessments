'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

/**
 * Student Help Center Page
 * 
 * Provides help and support resources for students
 */
export default function StudentHelp() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Help Center
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get help and support for using the Oral Assessment System
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Support Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <i className="fas fa-question-circle text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Help & Support
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This page will provide FAQs, tutorials, and contact information for support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
