import { api } from "./apiClient";

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api"; // align with backend summary

export const userService = {
  _toBackendRole(role) {
    if (!role) return undefined;
    return role.startsWith('ROLE_') ? role : `ROLE_${role.toUpperCase()}`;
  },

  async listAssignmentUsers(courseId, assignmentId, { role, q, page = 0, size = 25 } = {}) {
    // Map to backend naming conventions where needed (pageNum/pageSize) and include API prefix
    // Align to backend assignments-centric resource: /api/assignments/{id}/members
    const response = await api.get(`${API_PREFIX}/assignments/${assignmentId}/members`, {
      params: { role: this._toBackendRole(role), q, pageNum: page, pageSize: size },
    });
    const payload = response.data;
    // Normalize wrapper: if payload.data contains the list, unwrap it
    if (payload && payload.data && (Array.isArray(payload.data.data) || typeof payload.data.total !== 'undefined')) {
      const inner = payload.data;
      return {
        success: payload.success !== false,
        page: inner.page ?? inner.pageNum ?? page,
        size: inner.size ?? inner.pageSize ?? size,
        total: inner.total ?? inner.totalElements ?? inner.count ?? 0,
        data: inner.data ?? inner.items ?? [],
      };
    }
    return payload;
  },

  async addAssignmentUser(courseId, assignmentId, payload) {
    // Align to backend assignments-centric resource
    const response = await api.post(`${API_PREFIX}/assignments/${assignmentId}/members`, {
      ...payload,
      role: this._toBackendRole(payload.role),
    });
    const body = response.data;
    // Normalize wrapper if present
    if (body && typeof body.success !== 'undefined' && body.data) {
      return { success: body.success, data: body.data, code: body.code };
    }
    return body;
  },

  async removeAssignmentUser(assignmentId, assignmentUserId) {
    const response = await api.delete(`${API_PREFIX}/assignments/${assignmentId}/members/${assignmentUserId}`);
    const body = response.data;
    if (body && typeof body.success !== 'undefined' && body.data) {
      return { success: body.success, data: body.data, code: body.code };
    }
    return body;
  },
};

export default userService;
