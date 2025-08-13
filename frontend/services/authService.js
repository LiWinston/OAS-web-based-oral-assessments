import { api } from './apiClient';

/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls.
 * Uses the centralized API client which automatically handles
 * token attachment and error responses.
 */
export const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Response containing user data and JWT tokens
   */
  async login(email, password) {
    const response = await api.post('/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Logout current user
   * Requires userId and refreshToken for backend
   * @param {number} userId - User ID
   * @param {string} refreshToken - Refresh token
   */
  async logout(userId, refreshToken) {
    try {
      await api.post('/logout', {
        userId,
        refreshToken,
      });
    } catch (error) {
      // Handle logout errors gracefully
      console.warn('Logout request failed:', error);
    }
  },

  /**
   * Refresh authentication token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Response with new access token
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/token/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Get current authenticated user's profile
   * @returns {Promise<Object>} Current user data
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Change user password
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password to set
   * @returns {Promise<Object>} Success response
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Request password reset email
   * @param {string} email - Email address to send reset link
   * @returns {Promise<Object>} Success response
   */
  async requestPasswordReset(email) {
    const response = await api.post('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  /**
   * Reset password using token from email
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password to set
   * @returns {Promise<Object>} Success response
   */
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};