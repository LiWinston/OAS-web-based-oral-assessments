import { api } from "./apiClient";

// Admin service for Course Administrator management
// Handles invitation workflow, status tracking, and admin CRUD operations

export const adminService = {
  // Invite a new course administrator
  async inviteAdmin(adminData) {
    const response = await api.post('/admin/invite', adminData);
    return response.data;
  },

  // Get list of all administrators with filtering
  async getAdminList(filters = {}) {
    const response = await api.get('/admin/list', { params: filters });
    return response.data;
  },

  // Resend invitation to an admin
  async resendInvitation(adminId) {
    const response = await api.post(`/admin/${adminId}/resend-invitation`);
    return response.data;
  },

  // Update admin status (activate/deactivate)
  async updateAdminStatus(adminId, status) {
    const response = await api.patch(`/admin/${adminId}/status`, { status });
    return response.data;
  },

  // Revoke admin access
  async revokeAccess(adminId) {
    const response = await api.delete(`/admin/${adminId}/access`);
    return response.data;
  },

  // Check if email is already in use
  async checkDuplicateEmail(email) {
    const response = await api.get(`/admin/check-email/${encodeURIComponent(email)}`);
    return response.data;
  },

  // Get admin details
  async getAdminDetails(adminId) {
    const response = await api.get(`/admin/${adminId}`);
    return response.data;
  },

  // Update admin details
  async updateAdmin(adminId, adminData) {
    const response = await api.put(`/admin/${adminId}`, adminData);
    return response.data;
  },

  // Get admin statistics
  async getAdminStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  }
};