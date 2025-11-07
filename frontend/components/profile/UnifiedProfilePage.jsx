'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import profileService from '../../services/profileService';
import ProfileHeader from './ProfileHeader';
import ProfileInfoCard from './ProfileInfoCard';
import NotificationPreferencesCard from './NotificationPreferencesCard';
import SecurityCard from './SecurityCard';
import RoleWidgetGrid from './RoleWidgetGrid';

/**
 * UnifiedProfilePage Component
 *
 * Complete profile page implementation that works across all roles.
 * Fetches profile data, manages state, and handles all profile operations.
 */
export default function UnifiedProfilePage() {
  const router = useRouter();
  const { user: authUser, updateUser } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await profileService.getProfile();
      setProfileData(data);
    } catch (err) {
      setError('Failed to load profile data. Please try again.');
      console.error('Profile load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (updates) => {
    try {
      setIsUpdating(true);
      const updatedProfile = await profileService.updateProfile(updates);
      setProfileData(updatedProfile);

      // Update auth store with new user data
      updateUser({
        ...authUser,
        name: updatedProfile.user.name,
        department: updatedProfile.user.department,
        phone: updatedProfile.user.phone,
      });

      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferencesUpdate = async (preferences) => {
    try {
      setIsUpdating(true);
      const updatedProfile = await profileService.updatePreferences(preferences);
      setProfileData(updatedProfile);
      showToast('Preferences updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update preferences', 'error');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      setIsUpdating(true);
      await profileService.changePassword(currentPassword, newPassword);
      showToast('Password updated successfully', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      showToast(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrimaryAction = () => {
    if (!profileData?.user?.role) return;

    // Normalize role format (remove ROLE_ prefix if present)
    const normalizedRole = profileData.user.role.replace('ROLE_', '');

    switch (normalizedRole) {
      case 'STUDENT':
        router.push('/student/booking');
        break;
      case 'EXAMINER':
        router.push('/examiner/schedule');
        break;
      case 'ADMIN':
      case 'COURSE_ADMIN':
        router.push('/admin/courses');
        break;
      case 'SUPER_ADMIN':
        router.push('/superadmin/admins');
        break;
      default:
        break;
    }
  };

  const handleWidgetAction = (action, data) => {
    if (!profileData?.user?.role) return;

    // Normalize role format (remove ROLE_ prefix if present)
    const normalizedRole = profileData.user.role.replace('ROLE_', '');
    const baseRoute = `/${normalizedRole.toLowerCase().replace('_', '')}`;

    switch (action) {
      case 'booking':
        router.push('/student/booking');
        break;
      case 'results':
        router.push('/student/results');
        break;
      case 'schedule':
        router.push('/examiner/schedule');
        break;
      case 'feedback':
        router.push('/examiner/assessment');
        break;
      case 'courses':
        router.push('/admin/courses');
        break;
      case 'unstaffedSessions':
        router.push('/admin/courses?filter=unstaffed');
        break;
      case 'openSessions':
        router.push('/admin/courses?filter=open');
        break;
      case 'assignmentsPending':
        router.push('/admin/courses?filter=pending');
        break;
      case 'approvals':
        router.push('/superadmin/admins');
        break;
      case 'metrics':
        router.push('/superadmin/courses');
        break;
      default:
        break;
    }
  };

  const showToast = (message, type) => {
    // Implementation would depend on your toast/notification system
    // For now, using alert as fallback
    if (type === 'success') {
      console.log('Success:', message);
    } else {
      console.error('Error:', message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-2xl text-red-600 dark:text-red-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Unable to Load Profile
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadProfile}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <i className="fas fa-redo mr-2"></i>
          Try Again
        </button>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <ProfileHeader
        user={profileData.user}
        onPrimaryAction={handlePrimaryAction}
        isLoading={isUpdating}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Profile Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <ProfileInfoCard
            user={profileData.user}
            onSave={handleProfileUpdate}
            isLoading={isUpdating}
          />

          {/* Notification Preferences */}
          <NotificationPreferencesCard
            preferences={profileData.preferences}
            userRole={profileData.user.role}
            onSave={handlePreferencesUpdate}
            isLoading={isUpdating}
          />

          {/* Security Settings */}
          <SecurityCard
            onChangePassword={handlePasswordChange}
            isLoading={isUpdating}
          />
        </div>

        {/* Right Column - Role-Specific Widgets */}
        <div className="space-y-6">
          <RoleWidgetGrid
            widgets={profileData.widgets}
            userRole={profileData.user.role}
            onWidgetAction={handleWidgetAction}
          />
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-500">
            Debug: Profile Data
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
