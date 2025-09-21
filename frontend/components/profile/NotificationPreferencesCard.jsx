'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';

/**
 * NotificationPreferencesCard Component
 *
 * Manages notification preferences with role-aware toggles.
 * Supports email, desktop, and domain-specific notifications.
 */
export default function NotificationPreferencesCard({
  preferences,
  userRole,
  onSave,
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    email: preferences?.email || true,
    desktop: preferences?.desktop || false,
    bookingUpdates: preferences?.bookingUpdates || true,
    examinerUpdates: preferences?.examinerUpdates || true,
    assignmentUpdates: preferences?.assignmentUpdates || true,
    resultUpdates: preferences?.resultUpdates || true,
    groupUpdates: preferences?.groupUpdates || true,
    systemAlerts: preferences?.systemAlerts || true,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState({});

  const handleToggleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    setHasUnsavedChanges(true);
    if (errors[key]) {
      setErrors({ ...errors, [key]: '' });
    }
  };

  const handleSave = async () => {
    try {
      await onSave(formData);
      setHasUnsavedChanges(false);
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Failed to update preferences. Please try again.' });
    }
  };

  const handleResetToDefaults = () => {
    const defaults = {
      email: true,
      desktop: false,
      bookingUpdates: true,
      examinerUpdates: true,
      assignmentUpdates: true,
      resultUpdates: true,
      groupUpdates: true,
      systemAlerts: true,
    };
    setFormData(defaults);
    setHasUnsavedChanges(true);
  };

  const getNotificationOptions = () => {
    const baseOptions = [
      { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
      { key: 'desktop', label: 'Desktop Notifications', description: 'Show browser notifications' },
    ];

    const domainOptions = [
      { key: 'systemAlerts', label: 'System Alerts', description: 'Important system updates and maintenance notices' },
    ];

    // Role-specific notification options
    switch (userRole) {
      case 'STUDENT':
        domainOptions.unshift(
          { key: 'bookingUpdates', label: 'Booking Updates', description: 'Session booking confirmations and changes' },
          { key: 'resultUpdates', label: 'Results Updates', description: 'Assessment results and feedback' },
          { key: 'groupUpdates', label: 'Group Updates', description: 'Group assignment and collaboration updates' }
        );
        break;
      case 'EXAMINER':
        domainOptions.unshift(
          { key: 'assignmentUpdates', label: 'Assignment Updates', description: 'New assignments and schedule changes' },
          { key: 'examinerUpdates', label: 'Examiner Updates', description: 'Examiner-specific notifications and reminders' }
        );
        break;
      case 'COURSE_ADMIN':
        domainOptions.unshift(
          { key: 'assignmentUpdates', label: 'Assignment Updates', description: 'Course and assignment management updates' },
          { key: 'examinerUpdates', label: 'Examiner Activity', description: 'Examiner assignments and activity notifications' }
        );
        break;
      case 'SUPER_ADMIN':
        domainOptions.unshift(
          { key: 'assignmentUpdates', label: 'Assignment Updates', description: 'System-wide assignment updates' },
          { key: 'examinerUpdates', label: 'User Activity', description: 'User management and activity notifications' }
        );
        break;
      default:
        break;
    }

    return { baseOptions, domainOptions };
  };

  const renderToggle = (option) => (
    <div key={option.key} className="flex items-center justify-between">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {option.label}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {option.description}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={formData[option.key]}
          onChange={(e) => handleToggleChange(option.key, e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  );

  const { baseOptions, domainOptions } = getNotificationOptions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notification Preferences</CardTitle>
          {hasUnsavedChanges && (
            <Button onClick={handleSave} size="sm" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Preferences
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                You have unsaved changes
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Channel Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Notification Channels
            </h3>
            <div className="space-y-4">
              {baseOptions.map(renderToggle)}
            </div>
          </div>

          {/* Domain-Specific Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Notification Types
            </h3>
            <div className="space-y-4">
              {domainOptions.map(renderToggle)}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-end">
            <button
              onClick={handleResetToDefaults}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              disabled={isLoading}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}