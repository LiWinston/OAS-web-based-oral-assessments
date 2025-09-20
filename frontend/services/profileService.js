import apiClient from './apiClient';

/**
 * Profile Service
 *
 * Centralized service for user profile management across all roles.
 * Integrates with backend ProfileController endpoints and provides role-aware widgets.
 */
export const profileService = {
  /**
   * Get current user's profile with role-specific widgets
   * @returns {Promise<{user: Object, preferences: Object, widgets: Array, generatedAt: string}>}
   */
  async getProfile() {
    const response = await apiClient.get('/profile/me');
    return response.data.data;
  },

  /**
   * Update profile fields (name, phone, department, timezone, language)
   * @param {Object} updates - Profile updates
   * @returns {Promise<ProfileResponse>}
   */
  async updateProfile(updates = {}) {
    const response = await apiClient.put('/profile', updates);
    return response.data.data;
  },

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<ProfileResponse>}
   */
  async updatePreferences(preferences = {}) {
    const response = await apiClient.put('/profile/preferences', preferences);
    return response.data.data;
  },

  /**
   * Change password for current user
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export default profileService;


