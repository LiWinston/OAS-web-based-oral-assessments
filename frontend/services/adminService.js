import { api } from "./apiClient";

// Admin service for Course Administrator management
// Handles invitation workflow, status tracking, and admin CRUD operations

export const adminService = {
  // Validate that email is a unimelb student email
  validateUniversityEmail(email) {
    const re = /^[^@\s]+@student\.unimelb\.edu\.au$/i;
    if (!re.test(email)) {
      return { valid: false, message: "Email must be a @student.unimelb.edu.au address" };
    }
    return { valid: true };
  },

  // Invite a new course administrator
  async inviteAdmin(adminData) {
    try {
      const response = await api.post('/api/superadmin/admins/invite', adminData);
      return { success: true, data: response.data };
    } catch (error) {
      // Log the error for debugging
      console.error('Invite admin API error:', error);
      
      // Check if it's a network/server error
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || 
          error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        throw new Error('Backend server is not available. Please try again later.');
      }
      
      // Re-throw the original error for proper handling
      throw error;
    }
  },

  // Get list of all administrators with filtering
  async getAdminList(filters = {}) {
    try {
      const response = await api.post('/api/superadmin/admins', filters);

      // Debug: Log the raw response to see what backend returns
      console.log('=== ADMIN LIST API DEBUG ===');
      console.log('Full response:', response);
      console.log('Response.data:', response?.data);
      console.log('Response.data type:', typeof response?.data);
      console.log('Response.data keys:', response?.data ? Object.keys(response?.data) : 'N/A');
      if (Array.isArray(response?.data)) {
        console.log('Response.data is array, length:', response?.data.length);
        console.log('First item:', response?.data[0]);
      }
      console.log('=== END DEBUG ===');

      // Normalize various backend shapes into the UI-required schema
      const raw = response?.data;
      const payload = (raw && (raw.data ?? raw.result ?? raw.payload)) ?? raw;

      let pendingInvitations = [];
      let activeAdmins = [];

      if (Array.isArray(payload)) {
        // Backend returned a flat array of admins
        activeAdmins = payload;
      } else if (payload && typeof payload === 'object') {
        // Common aliases from different backends
        if (Array.isArray(payload.activeAdmins) || Array.isArray(payload.pendingInvitations)) {
          activeAdmins = payload.activeAdmins || [];
          pendingInvitations = payload.pendingInvitations || [];
        } else if (Array.isArray(payload.admins) || Array.isArray(payload.invitations)) {
          activeAdmins = payload.admins || [];
          pendingInvitations = payload.invitations || [];
        } else if (Array.isArray(payload.items) || Array.isArray(payload.list) || Array.isArray(payload.records) || Array.isArray(payload.rows)) {
          activeAdmins = payload.items || payload.list || payload.records || payload.rows || [];
        } else {
          // Fallback: try to detect arrays inside object
          const arrays = Object.values(payload).filter(Array.isArray);
          if (arrays.length === 1) {
            activeAdmins = arrays[0];
          } else if (arrays.length >= 2) {
            // Heuristic: first array as active, second as pending
            activeAdmins = arrays[0] || [];
            pendingInvitations = arrays[1] || [];
          }
        }
      }

      // Debug: Log the normalized data
      console.log('=== NORMALIZED DATA DEBUG ===');
      console.log('Normalized pendingInvitations:', pendingInvitations);
      console.log('Normalized activeAdmins:', activeAdmins);
      console.log('=== END NORMALIZED DEBUG ===');

      return { success: true, data: { pendingInvitations, activeAdmins } };
    } catch (error) {
      console.error('Get admin list API error:', error);
      return { success: false, data: { pendingInvitations: [], activeAdmins: [] } };
    }
  },

  // Resend invitation to an admin (not available in current API)
  async resendInvitation(adminId) {
    // TODO: This endpoint is not available in the current backend API
    console.warn('Resend invitation endpoint not available in backend API');
    return { success: true, message: 'Resend invitation not implemented yet' };
  },

  // Update admin status (activate/deactivate)
  async updateAdminStatus(adminId, status) {
    try {
      const response = await api.post(`/api/superadmin/admins/${adminId}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update admin status API error:', error);
      return { success: false, data: null };
    }
  },

  // Revoke admin access
  async revokeAccess(adminId) {
    try {
      const response = await api.post(`/api/superadmin/admins/revoke/${adminId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Revoke access API error:', error);
      return { success: false, data: null };
    }
  },

  // Check if email is already in use
  async checkDuplicateEmail(email) {
    try {
      const response = await api.get(`/api/superadmin/admins/check-email/${encodeURIComponent(email)}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Check duplicate email API error:', error);
      return { success: false, data: { isDuplicate: false } };
    }
  },

  // Get admin details
  async getAdminDetails(adminId) {
    try {
      const response = await api.get(`/api/superadmin/admins/${adminId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get admin details API error:', error);
      return { success: false, data: null };
    }
  },

  // Update admin details (not available in current API)
  async updateAdmin(adminId, adminData) {
    // TODO: This endpoint is not available in the current backend API
    console.warn('Update admin endpoint not available in backend API');
    return { success: true, message: 'Update admin not implemented yet' };
  },

  // Get admin statistics
  async getAdminStats() {
    try {
      const response = await api.get('/api/superadmin/admins/status');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get admin stats API error:', error);
      return { success: false, data: null };
    }
  }
};