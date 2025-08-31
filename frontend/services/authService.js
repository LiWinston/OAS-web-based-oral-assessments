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
    
    // Handle backend response structure
    const responseData = response.data.data || response.data;
    
    return {
      success: response.data.success !== false,
      data: responseData
    };
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
   * Request password reset verification code
   * @param {string} email - Email address to send verification code
   * @returns {Promise<Object>} Success response (always returns 200 for security)
   */
  async requestPasswordReset(email) {
    const response = await api.post('/auth/password-reset/request', {
      email,
    });
    
    // Handle backend response structure
    const responseData = response.data.data || response.data;
    
    return {
      success: response.data.success !== false,
      message: responseData.message || responseData || "If an account exists, a verification code has been sent."
    };
  },

  /**
   * Confirm password reset with verification code
   * @param {string} email - User email
   * @param {string} code - 6-digit verification code
   * @param {string} newPassword - New password to set
   * @returns {Promise<Object>} Success response
   */
  async confirmPasswordReset(email, code, newPassword) {
    const response = await api.post('/auth/password-reset/confirm', {
      email,
      code,
      newPassword,
    });
    
    // Handle backend response structure
    const responseData = response.data.data || response.data;
    
    return {
      success: response.data.success !== false,
      message: responseData.message || responseData || "Password has been reset successfully."
    };
  },
};

// Export as default for backward compatibility
export default authService;