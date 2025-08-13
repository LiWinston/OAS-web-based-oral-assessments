import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Authentication Store
 * 
 * Global state management for authentication using Zustand.
 * Handles user session data, JWT tokens, and authentication status.
 * Persists state to localStorage for session continuity across page reloads.
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,           // Current user object with id, email, name, role, etc.
      userId: null,         // User ID from backend
      accessToken: null,    // JWT access token
      refreshToken: null,   // JWT refresh token
      tokenType: 'Bearer',  // Token type from backend
      expiresIn: null,      // Token expiration time in seconds
      isAuthenticated: false, // Authentication status flag
      isLoading: false,     // Loading state for auth operations

      // Actions
      /**
       * Handle user login with backend response format
       * @param {Object} loginData - Complete login response data from backend
       */
      login: (loginData) => {
        // Extract data from backend response
        const { userId, username, role, email, accessToken, refreshToken, tokenType, expiresIn } = loginData;
        
        // Map backend roles to frontend roles
        const roleMapping = {
          'ROLE_ADMIN': 'COURSE_ADMIN',      // Backend ROLE_ADMIN = Frontend COURSE_ADMIN
          'ROLE_STUDENT': 'STUDENT',
          'ROLE_EXAMINER': 'EXAMINER',
          'ROLE_SUPER_ADMIN': 'SUPER_ADMIN',
        };
        
        const normalizedRole = roleMapping[role] || role;
        
        // Store tokens in cookies for security
        if (typeof document !== 'undefined') {
          // Access token with shorter expiry
          document.cookie = `access-token=${accessToken}; path=/; secure; samesite=strict; max-age=${expiresIn || 900}`; // Default 15 minutes
          // Refresh token with longer expiry
          document.cookie = `refresh-token=${refreshToken}; path=/; secure; samesite=strict; max-age=${7 * 24 * 60 * 60}`; // 7 days
        }
        
        set({
          user: {
            id: userId,
            username,
            email,
            role: normalizedRole,  // Use normalized role for frontend
          },
          userId,
          accessToken,
          refreshToken,
          tokenType,
          expiresIn,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      /**
       * Handle user logout
       * @param {string} redirectTo - Path to redirect after logout (default: '/login')
       */
      logout: async (redirectTo = '/login') => {
        const state = get();
        const { userId, refreshToken } = state;
        
        // Call backend logout if we have the required data
        if (userId && refreshToken) {
          try {
            const { authService } = await import('@/services/authService');
            await authService.logout(userId, refreshToken);
          } catch (error) {
            console.warn('Backend logout failed:', error);
          }
        }
        
        // Clear authentication cookies
        if (typeof document !== 'undefined') {
          document.cookie = 'access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          document.cookie = 'refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
        
        // Clear localStorage completely to ensure clean logout
        localStorage.removeItem('oas-auth-storage');
        
        set({
          user: null,
          userId: null,
          accessToken: null,
          refreshToken: null,
          tokenType: 'Bearer',
          expiresIn: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // Redirect based on user role or provided path
        if (typeof window !== 'undefined') {
          window.location.href = redirectTo;
        }
      },

      /**
       * Set loading state
       * @param {boolean} loading - Loading state value
       */
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      /**
       * Update user data
       * @param {Object} userData - Updated user data object
       */
      updateUser: (userData) => {
        set({ user: userData });
      },

      // Helpers
      /**
       * Get current user's role
       * @returns {string|null} User role or null if not authenticated
       */
      getRole: () => {
        const user = get().user;
        return user?.role || null;
      },

      /**
       * Get current user's ID
       * @returns {number|null} User ID or null if not authenticated
       */
      getUserId: () => {
        const user = get().user;
        return user?.id || null;
      },

      /**
       * Check if user has a specific role
       * @param {string} role - Role to check (STUDENT, EXAMINER, COURSE_ADMIN, SUPER_ADMIN)
       * @returns {boolean} True if user has the specified role
       */
      hasRole: (role) => {
        const userRole = get().getRole();
        return userRole === role;
      },

      /**
       * Smart logout that redirects to appropriate login portal based on user role
       * Super admins are redirected to /superadmin-login, others to /login
       */
      smartLogout: () => {
        const currentUser = get().user;
        const redirectPath = currentUser?.role === 'SUPER_ADMIN' 
          ? '/superadmin-login' 
          : '/login';
        
        get().logout(redirectPath);
      },
    }),
    {
      name: "oas-auth-storage", // localStorage key
      partialize: (state) => ({
        // Only persist these fields to localStorage
        user: state.user,
        userId: state.userId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenType: state.tokenType,
        expiresIn: state.expiresIn,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
export default useAuthStore;
