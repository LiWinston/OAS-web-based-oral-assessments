import { api } from "./apiClient";

// For development - mock API responses (env-driven)
const USE_MOCK_API = (process.env.NEXT_PUBLIC_USE_MOCK_API || "true") === "true";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api"; // align with backend summary

// In-memory mock data keyed by assignmentId and role
const mockDb = {
  usersByEmail: new Map(
    [
      ["s1@student.edu", { userId: 501, email: "s1@student.edu", fullName: "Student One" }],
      ["s2@student.edu", { userId: 502, email: "s2@student.edu", fullName: "Student Two" }],
      ["e1@uni.edu", { userId: 601, email: "e1@uni.edu", fullName: "Examiner A" }],
      ["e2@uni.edu", { userId: 602, email: "e2@uni.edu", fullName: "Examiner B" }],
    ]
  ),
  assignmentUsers: new Map(), // key: `${assignmentId}|${role}` => array
};

function ensureSeed(assignmentId) {
  const keyS = `${assignmentId}|STUDENT`;
  const keyE = `${assignmentId}|EXAMINER`;
  if (!mockDb.assignmentUsers.has(keyS)) {
    mockDb.assignmentUsers.set(keyS, [
      {
        assignmentUserId: 1001,
        userId: 501,
        role: "ROLE_STUDENT",
        email: "s1@student.edu",
        fullName: "Student One",
        groupId: "G-01",
        bookingsCount: 1,
        addedAt: "2025-08-01T10:00:00Z",
      },
      {
        assignmentUserId: 1002,
        userId: 502,
        role: "ROLE_STUDENT",
        email: "s2@student.edu",
        fullName: "Student Two",
        groupId: null,
        bookingsCount: 0,
        addedAt: "2025-08-02T10:00:00Z",
      },
    ]);
  }
  if (!mockDb.assignmentUsers.has(keyE)) {
    mockDb.assignmentUsers.set(keyE, [
      {
        assignmentUserId: 2001,
        userId: 601,
        role: "ROLE_EXAMINER",
        email: "e1@uni.edu",
        fullName: "Examiner A",
        assignedSlotsCount: 3,
        addedAt: "2025-08-02T11:00:00Z",
      },
      {
        assignmentUserId: 2002,
        userId: 602,
        role: "ROLE_EXAMINER",
        email: "e2@uni.edu",
        fullName: "Examiner B",
        assignedSlotsCount: 0,
        addedAt: "2025-08-03T11:00:00Z",
      },
    ]);
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const mockService = {
  async listAssignmentUsers(courseId, assignmentId, { role, q, page = 0, size = 50 } = {}) {
    await delay(400);
    ensureSeed(assignmentId);
    let data = [];
    if (role) {
      const roleKey = role.startsWith('ROLE_') ? role.slice(5) : role;
      data = mockDb.assignmentUsers.get(`${assignmentId}|${roleKey}`) || [];
    } else {
      data = [
        ...(mockDb.assignmentUsers.get(`${assignmentId}|STUDENT`) || []),
        ...(mockDb.assignmentUsers.get(`${assignmentId}|EXAMINER`) || []),
      ];
    }
    if (q) {
      const Q = q.toLowerCase();
      data = data.filter((u) =>
        (u.email || "").toLowerCase().includes(Q) || (u.fullName || "").toLowerCase().includes(Q)
      );
    }
    return {
      success: true,
      page,
      size,
      total: data.length,
      data: data.slice(page * size, page * size + size),
    };
  },

  async addAssignmentUser(courseId, assignmentId, payload) {
    await delay(500);
    ensureSeed(assignmentId);
    const { role, email, fullName, studentId, staffId, groupId } = payload;
    const normalizedRole = role && role.startsWith('ROLE_') ? role : `ROLE_${(role || 'STUDENT').toUpperCase()}`;
    const key = `${assignmentId}|${normalizedRole.slice(5)}`;
    const list = mockDb.assignmentUsers.get(key) || [];

    if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, code: "ALREADY_IN_ASSIGNMENT", message: "User already in this assignment" };
    }

    let systemUser = mockDb.usersByEmail.get(email.toLowerCase());
    let created = false;
    if (!systemUser) {
      systemUser = {
        userId: Math.floor(700 + Math.random() * 1000),
        email,
        fullName: fullName || email.split("@")[0],
      };
      mockDb.usersByEmail.set(email.toLowerCase(), systemUser);
      created = true;
    }

    const assignmentUser = {
      assignmentUserId: Date.now(),
      userId: systemUser.userId,
      role: normalizedRole,
      email: systemUser.email,
      fullName: systemUser.fullName,
      addedAt: new Date().toISOString(),
      ...(normalizedRole === "ROLE_STUDENT" ? { groupId: groupId || null, bookingsCount: 0, studentId: studentId || null } : {}),
      ...(normalizedRole === "ROLE_EXAMINER" ? { assignedSlotsCount: 0, staffId: staffId || null } : {}),
    };
    list.push(assignmentUser);
    mockDb.assignmentUsers.set(key, list);

    return {
      success: true,
      data: {
        assignmentUserId: assignmentUser.assignmentUserId,
        userId: assignmentUser.userId,
        created,
        linked: true,
        email: assignmentUser.email,
        role,
        inviteSent: created,
      },
    };
  },

  async removeAssignmentUser(assignmentId, assignmentUserId) {
    await delay(400);
    // Try both roles
    const keyS = `${assignmentId}|STUDENT`;
    const keyE = `${assignmentId}|EXAMINER`;
    const removeFrom = (key) => {
      const arr = mockDb.assignmentUsers.get(key) || [];
      const idx = arr.findIndex((u) => u.assignmentUserId === assignmentUserId);
      if (idx >= 0) {
        const [removed] = arr.splice(idx, 1);
        mockDb.assignmentUsers.set(key, arr);
        return removed;
      }
      return null;
    };
    const removed = removeFrom(keyS) || removeFrom(keyE);
    if (!removed) {
      return { success: false, code: "NOT_FOUND", message: "Assignment user not found" };
    }
    const isStudent = removed.role === "ROLE_STUDENT" || removed.role === "STUDENT";
    return {
      success: true,
      data: {
        assignmentUserId,
        role: removed.role,
        canceledBookings: isStudent ? (removed.bookingsCount || 0) : 0,
        clearedExaminerSlots: !isStudent ? (removed.assignedSlotsCount || 0) : 0,
      },
    };
  },
};

export const userService = {
  _toBackendRole(role) {
    if (!role) return undefined;
    return role.startsWith('ROLE_') ? role : `ROLE_${role.toUpperCase()}`;
  },

  async listAssignmentUsers(courseId, assignmentId, { role, q, page = 0, size = 25 } = {}) {
    if (USE_MOCK_API) return mockService.listAssignmentUsers(courseId, assignmentId, { role, q, page, size });
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
    if (USE_MOCK_API) return mockService.addAssignmentUser(courseId, assignmentId, payload);
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
    if (USE_MOCK_API) return mockService.removeAssignmentUser(assignmentId, assignmentUserId);
    const response = await api.delete(`${API_PREFIX}/assignments/${assignmentId}/members/${assignmentUserId}`);
    const body = response.data;
    if (body && typeof body.success !== 'undefined' && body.data) {
      return { success: body.success, data: body.data, code: body.code };
    }
    return body;
  },
};

export default userService;
