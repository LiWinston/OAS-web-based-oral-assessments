import { api } from './apiClient';
import { authApi } from './authApiClient';

export const authService = {
  // Login user
  async login(email, password) {
    console.log('🔐 Attempting login with:', { email, password: '***' });
    try {
      const response = await authApi.post('/login', {
        email,
        password,
      });
      console.log('✅ Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await authApi.post('/logout');
    } catch (error) {
      // Handle logout errors gracefully
      console.warn('Logout request failed:', error);
    }
  },

  // Refresh token
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  // Get current user profile
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Request password reset
  async requestPasswordReset(email) {
    const response = await api.post('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  // Reset password with token
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};