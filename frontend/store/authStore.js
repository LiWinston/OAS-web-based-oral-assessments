import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (token, userData) => {
        // Store token in cookie as well
        document.cookie = `auth-token=${token}; path=/; secure; samesite=strict; max-age=${15 * 60}`; // 15 minutes
        
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: (redirectTo = '/login') => {
        // Clear cookie
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        // Clear localStorage completely to ensure clean logout
        localStorage.removeItem('oas-auth-storage');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // Redirect based on user role or provided path
        if (typeof window !== 'undefined') {
          window.location.href = redirectTo;
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      updateUser: (userData) => {
        set({ user: userData });
      },

      // Helpers
      getRole: () => {
        const user = get().user;
        return user?.role || null;
      },

      getUserId: () => {
        const user = get().user;
        return user?.id || null;
      },

      hasRole: (role) => {
        const userRole = get().getRole();
        return userRole === role;
      },

      // Smart logout that redirects to appropriate login portal
      smartLogout: () => {
        const currentUser = get().user;
        const redirectPath = currentUser?.role === 'SUPER_ADMIN' 
          ? '/superadmin-login' 
          : '/login';
        
        get().logout(redirectPath);
      },
    }),
    {
      name: "oas-auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
export default useAuthStore;
