'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

/**
 * ProfileInfoCard Component
 *
 * Displays and allows editing of personal information fields.
 * Supports both view and edit modes with validation.
 */
export default function ProfileInfoCard({ user, onSave, isLoading = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || '',
    timezone: user?.timezone || 'Australia/Melbourne',
    language: user?.language || 'English',
  });
  const [errors, setErrors] = useState({});

  const handleEdit = () => {
    setIsEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      phone: user?.phone || '',
      timezone: user?.timezone || 'Australia/Melbourne',
      language: user?.language || 'English',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const updates = {
        name: formData.name,
        department: formData.department,
        phone: formData.phone,
        timezone: formData.timezone,
        language: formData.language,
      };

      await onSave(updates);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const isReadOnlyField = (field) => {
    return field === 'email' || (field === 'studentId' && user?.role === 'STUDENT');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Personal Information</CardTitle>
          {!isEditing ? (
            <Button onClick={handleEdit} variant="outline" size="sm">
              <i className="fas fa-edit mr-2"></i>
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} size="sm" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save
                  </>
                )}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="mt-1 bg-gray-50 dark:bg-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
          </div>

          {user?.role === 'STUDENT' && (
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={user?.userId || ''}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-700"
              />
            </div>
          )}

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
              placeholder="Enter your department"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              disabled={!isEditing}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800"
            >
              <option value="Australia/Melbourne">Australia/Melbourne</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
              <option value="Australia/Brisbane">Australia/Brisbane</option>
              <option value="Australia/Perth">Australia/Perth</option>
              <option value="UTC">UTC</option>
            </select>
            {isEditing && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Timezone changes will be implemented in a future update
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              disabled={!isEditing}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800"
            >
              <option value="English">English</option>
              <option value="Chinese">Chinese</option>
            </select>
            {isEditing && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Language changes will be implemented in a future update
              </p>
            )}
          </div>
        </div>

        {user?.lastUpdatedAt && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(user.lastUpdatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}