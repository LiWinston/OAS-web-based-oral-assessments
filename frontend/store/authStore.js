import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const isClient = typeof window !== "undefined";
const CHANNEL_NAME = "oas-auth-sync";
const clientId =
  isClient && typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}`;

let broadcastChannel = null;

const getMessageChannel = () => {
  if (!isClient) return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return broadcastChannel;
};

const postAuthMessage = (message) => {
  if (!isClient) return;
  const payload = { ...message, source: clientId, timestamp: Date.now() };
  const channel = getMessageChannel();
  if (channel) {
    channel.postMessage(payload);
  } else {
    try {
      localStorage.setItem(`${CHANNEL_NAME}-message`, JSON.stringify(payload));
      localStorage.removeItem(`${CHANNEL_NAME}-message`);
    } catch (error) {
      console.warn("Auth sync broadcast failed", error);
    }
  }
};

const notifySessionChange = (message) => {
  if (!isClient) return;
  const flag = "__oasAuthSessionNotify";
  if (window[flag]) return;
  window[flag] = true;
  try {
    window.alert(message);
  } finally {
    window.setTimeout(() => {
      window[flag] = false;
    }, 1000);
  }
};

const storageCreator = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return window.sessionStorage;
};

/**
 * Authentication Store
 *
 * Global state management for authentication using Zustand.
 * Handles user session data, JWT tokens, and authentication status.
 * Persists state to sessionStorage for continuity within the same tab while
 * preventing cross-tab state leakage.
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null, // Current user object with id, email, name, role, etc.
      userId: null, // User ID from backend
      accessToken: null, // JWT access token
      refreshToken: null, // JWT refresh token
      tokenType: "Bearer", // Token type from backend
      expiresIn: null, // Token expiration time in seconds
      isAuthenticated: false, // Authentication status flag
      isLoading: false, // Loading state for auth operations

      // Actions
      /**
       * Handle user login with backend response format
       * @param {Object} loginData - Complete login response data from backend
       */
      login: (loginData, options = {}) => {
        const { suppressBroadcast = false } = options;
        // Extract data from backend response
        const {
          userId,
          username,
          role,
          email,
          accessToken,
          refreshToken,
          tokenType,
          expiresIn,
        } = loginData;

        // Map backend roles to frontend roles
        const roleMapping = {
          ROLE_ADMIN: "COURSE_ADMIN", // Backend ROLE_ADMIN = Frontend COURSE_ADMIN
          ROLE_STUDENT: "STUDENT",
          ROLE_EXAMINER: "EXAMINER",
          ROLE_SUPER_ADMIN: "SUPER_ADMIN",
        };

        const normalizedRole = roleMapping[role] || role;

        // Store tokens in cookies for security
        if (typeof document !== "undefined") {
          const isSecure =
            typeof window !== "undefined" &&
            window.location.protocol === "https:";
          const secureFlag = isSecure ? " Secure;" : "";
          // Access token with shorter expiry
          document.cookie = `access-token=${accessToken}; Path=/;${secureFlag} SameSite=Strict; Max-Age=${
            expiresIn || 900
          }`; // Default 15 minutes
          // Refresh token with longer expiry
          document.cookie = `refresh-token=${refreshToken}; Path=/;${secureFlag} SameSite=Strict; Max-Age=${
            7 * 24 * 60 * 60
          }`; // 7 days
        }

        set({
          user: {
            id: userId,
            username,
            email,
            role: normalizedRole, // Use normalized role for frontend
          },
          userId,
          accessToken,
          refreshToken,
          tokenType,
          expiresIn,
          isAuthenticated: true,
          isLoading: false,
        });

        if (!suppressBroadcast) {
          postAuthMessage({ type: "login", userId });
        }
      },

      /**
       * Handle user logout
       * @param {string} redirectTo - Path to redirect after logout (default: '/login')
       */
      logout: async (redirectTo = "/login", options = {}) => {
        const {
          broadcast = true,
          preserveTokens = false,
          skipBackend = false,
          skipRedirect = false,
          skipStorage = false,
        } = options;
        const state = get();
        const { userId, refreshToken } = state;

        // Call backend logout if we have the required data
        if (!skipBackend && userId && refreshToken) {
          try {
            const { authService } = await import("@/services/authService");
            await authService.logout(userId, refreshToken);
          } catch (error) {
            console.warn("Backend logout failed:", error);
          }
        }

        // Clear authentication cookies
        if (!preserveTokens && typeof document !== "undefined") {
          document.cookie =
            "access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          document.cookie =
            "refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          document.cookie =
            "auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }

        // Clear persisted auth state for this tab
        if (!skipStorage && typeof window !== "undefined") {
          try {
            window.sessionStorage.removeItem("oas-auth-storage");
          } catch (error) {
            console.warn("Failed to clear auth storage", error);
          }
        }

        set({
          user: null,
          userId: null,
          accessToken: null,
          refreshToken: null,
          tokenType: "Bearer",
          expiresIn: null,
          isAuthenticated: false,
          isLoading: false,
        });

        if (broadcast) {
          postAuthMessage({ type: "logout", userId });
        }

        // Redirect based on user role or provided path
        if (!skipRedirect && typeof window !== "undefined") {
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
      smartLogout: (options = {}) => {
        const currentUser = get().user;
        const redirectPath =
          currentUser?.role === "SUPER_ADMIN" ? "/superadmin-login" : "/login";

        return get().logout(redirectPath, options);
      },
    }),
    {
      name: "oas-auth-storage", // storage key
      storage: createJSONStorage(storageCreator),
      partialize: (state) => ({
        // Only persist these fields to storage
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

const handleAuthSyncMessage = (payload) => {
  if (!payload || payload.source === clientId) return;
  const { type, userId } = payload;
  const store = useAuthStore.getState();

  if (!store.isAuthenticated) {
    return;
  }

  if (type === "login") {
    notifySessionChange(
      "You signed in from another tab or window. This session has been signed out to keep your account secure."
    );
    store.smartLogout({
      broadcast: false,
      preserveTokens: true,
      skipBackend: true,
    });
  } else if (type === "logout") {
    notifySessionChange(
      "You signed out in another tab or window. Please sign in again to continue."
    );
    store.smartLogout({
      broadcast: false,
      preserveTokens: true,
      skipBackend: true,
    });
  }
};

const setupAuthSync = () => {
  if (!isClient) return;
  if (window.__oasAuthSyncInitialized) return;
  window.__oasAuthSyncInitialized = true;

  const channel = getMessageChannel();
  if (channel) {
    channel.onmessage = (event) => {
      handleAuthSyncMessage(event.data);
    };
  }

  window.addEventListener("storage", (event) => {
    if (event.key === `${CHANNEL_NAME}-message` && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        handleAuthSyncMessage(payload);
      } catch (error) {
        console.warn("Auth sync message parsing failed", error);
      }
    }
  });
};

if (isClient) {
  setupAuthSync();
}

export { useAuthStore };
export default useAuthStore;
