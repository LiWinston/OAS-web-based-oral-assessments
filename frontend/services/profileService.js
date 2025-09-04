import apiClient from './apiClient';

/**
 * Profile Service
 *
 * Centralized service for user profile across roles (Admin, Examiner, Student).
 * Follows existing patterns: returns normalized shapes and can be backed by mocks later.
 */
export const profileService = {
  /**
   * Get current user's profile (role-aware)
   */
  async getProfile() {
    const response = await apiClient.get('/profile/me');
    const payload = response?.data?.data || response?.data || {};
    // Normalize to { user: { id, email, role, name, ... } }
    const user = payload.user || payload;
    return { success: true, data: { user } };
  },

  /**
   * Update profile fields (name, phone, department, preferences, etc.)
   * Delegates to role-specific endpoints when available; falls back to generic.
   */
  async updateProfile(updates = {}) {
    // Generic endpoint sketch; backend to implement per API doc
    const response = await apiClient.put('/profile', updates);
    return response.data;
  },

  /**
   * Change password for current user
   */
  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences = {}) {
    const response = await apiClient.put('/profile/preferences', preferences);
    return response.data;
  },
};

export default profileService;


