'use client';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

/**
 * ProfileHeader Component
 *
 * Displays user avatar, name, role badge, completeness meter, and primary action button.
 * Follows the design specification for consistent profile header across all roles.
 */
export default function ProfileHeader({ user, onPrimaryAction, isLoading = false }) {
  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getCompletenessColor = (completeness) => {
    if (completeness >= 80) return 'bg-emerald-500';
    if (completeness >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getRoleBadgeColor = (role) => {
    // Handle both frontend and backend role formats
    const normalizedRole = role?.replace('ROLE_', '');

    switch (normalizedRole) {
      case 'STUDENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'EXAMINER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ADMIN':
      case 'COURSE_ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRoleDisplayName = (role) => {
    // Handle both frontend and backend role formats
    const normalizedRole = role?.replace('ROLE_', '');

    switch (normalizedRole) {
      case 'STUDENT':
        return 'Student';
      case 'EXAMINER':
        return 'Examiner';
      case 'ADMIN':
      case 'COURSE_ADMIN':
        return 'Course Administrator';
      case 'SUPER_ADMIN':
        return 'Super Administrator';
      default:
        return normalizedRole || 'User';
    }
  };

  const getPrimaryActionText = (role) => {
    switch (role) {
      case 'STUDENT':
        return 'Manage Booking';
      case 'EXAMINER':
        return 'View Schedule';
      case 'COURSE_ADMIN':
        return 'Review Tasks';
      case 'SUPER_ADMIN':
        return 'Review Approvals';
      default:
        return 'Dashboard';
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center ring-4 ring-indigo-100 dark:ring-indigo-900">
                <span className="text-2xl font-bold text-white">
                  {getInitials(user.name)}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user.name || 'User'}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  University of Melbourne
                </span>
              </div>

              {/* Completeness Meter */}
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Profile:</span>
                <div className="flex-1 max-w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getCompletenessColor(user.completeness || 0)}`}
                    style={{ width: `${user.completeness || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.completeness || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <Button
            onClick={onPrimaryAction}
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Loading...
              </>
            ) : (
              getPrimaryActionText(user.role)
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}