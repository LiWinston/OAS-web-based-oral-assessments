import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUIStore = create(
  persist(
    (set, get) => ({
      // State
      darkMode: false,
      sidebarOpen: true,
      sidebarCollapsed: false,
      globalLoading: false,
      notifications: [],

      // Actions
      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        set({ darkMode: newDarkMode });

        // Apply dark mode to document
        if (typeof window !== "undefined") {
          if (newDarkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },

      setDarkMode: (isDark) => {
        set({ darkMode: isDark });

        // Apply dark mode to document
        if (typeof window !== "undefined") {
          if (isDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },

      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen });
      },

      setSidebarOpen: (isOpen) => {
        set({ sidebarOpen: isOpen });
      },

      toggleSidebarCollapsed: () => {
        set({ sidebarCollapsed: !get().sidebarCollapsed });
      },

      setSidebarCollapsed: (isCollapsed) => {
        set({ sidebarCollapsed: isCollapsed });
      },

      setGlobalLoading: (isLoading) => {
        set({ globalLoading: isLoading });
      },

      addNotification: (notification) => {
        set({
          notifications: [
            ...get().notifications,
            {
              id: Date.now(),
              timestamp: new Date(),
              ...notification,
            },
          ],
        });
      },

      removeNotification: (id) => {
        set({
          notifications: get().notifications.filter((n) => n.id !== id),
        });
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Initialize dark mode from system preference
      initializeDarkMode: () => {
        if (typeof window !== "undefined") {
          const stored = get().darkMode;
          const systemPrefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          const shouldUseDark = stored !== null ? stored : systemPrefersDark;

          get().setDarkMode(shouldUseDark);
        }
      },
    }),
    {
      name: "oas-ui-storage",
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

export default useUIStore;
