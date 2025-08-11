import { useEffect } from "react";
import useAuthStore from "../store/authStore";

const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    smartLogout,
    setLoading,
    updateUser,
    getRole,
    getUserId,
    hasRole,
  } = useAuthStore();

  // Check if user is authenticated
  const checkAuth = () => {
    return isAuthenticated && token && user;
  };

  // Check if user has specific role
  const checkRole = (role) => {
    return hasRole(role);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    const userRole = getRole();
    return roles.includes(userRole);
  };

  // Get user permissions based on role
  const getPermissions = () => {
    const role = getRole();

    switch (role) {
      case "STUDENT":
        return {
          canViewAssignments: true,
          canBookSlots: true,
          canViewResults: true,
          canViewGroups: true,
        };
      case "EXAMINER":
        return {
          canViewAssignments: true,
          canSetAvailability: true,
          canMarkAssessments: true,
          canViewResults: true,
          canManageComments: true,
        };
      case "COURSE_ADMIN":
        return {
          canCreateAssignments: true,
          canManageUsers: true,
          canManageScheduling: true,
          canViewAllResults: true,
          canExportResults: true,
          canManageRubrics: true,
        };
      case "SUPER_ADMIN":
        return {
          canManageCourses: true,
          canManageAdmins: true,
          canViewSystemStats: true,
          canAccessAllFeatures: true,
        };
      default:
        return {};
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    // Check if we have stored auth data
    if (token && user && !isAuthenticated) {
      // Validate token with backend if needed
      // For now, just set as authenticated
      login(user, token);
    }
  }, [token, user, isAuthenticated, login]);

  return {
    // State
    user,
    token,
    isAuthenticated: checkAuth(),
    isLoading,
    role: getRole(),
    userId: getUserId(),
    permissions: getPermissions(),

    // Actions
    login,
    logout,
    smartLogout,
    setLoading,
    updateUser,

    // Helpers
    checkAuth,
    checkRole,
    hasRole,
    hasAnyRole,
    getPermissions,

    // Role checks
    isStudent: () => checkRole("STUDENT"),
    isExaminer: () => checkRole("EXAMINER"),
    isCourseAdmin: () => checkRole("COURSE_ADMIN"),
    isSuperAdmin: () => checkRole("SUPER_ADMIN"),
  };
};

export default useAuth;
