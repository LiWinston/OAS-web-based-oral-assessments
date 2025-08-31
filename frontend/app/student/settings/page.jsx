'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

/**
 * Student Settings Page
 * 
 * Allows students to manage their account settings and preferences
 */
export default function StudentSettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <i className="fas fa-cog text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              User Settings
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This page will provide user profile settings, notification preferences, and account management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
