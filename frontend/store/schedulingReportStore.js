"use client";

import { create } from "zustand";

const defaultState = {
  assignmentId: "",
  selectedDate: "",
  selectedMonth: "",
  statusFilter: "all",
  venueFilter: "all",
  searchTerm: "",
  viewMode: "table",
  presetRange: "today",
  activeSession: null,
  lastRefreshedAt: null,
};

export const useSchedulingReportStore = create((set) => ({
  ...defaultState,

  setAssignmentId: (assignmentId) =>
    set((state) => ({
      assignmentId,
      selectedDate: state.assignmentId === assignmentId ? state.selectedDate : "",
      selectedMonth: state.assignmentId === assignmentId ? state.selectedMonth : "",
      activeSession: null,
    })),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),

  setStatusFilter: (statusFilter) => set({ statusFilter }),

  setVenueFilter: (venueFilter) => set({ venueFilter }),

  setSearchTerm: (searchTerm) => set({ searchTerm }),

  setViewMode: (viewMode) => set({ viewMode }),

  setPresetRange: (presetRange) => set({ presetRange }),

  setActiveSession: (session) => set({ activeSession: session }),

  closeDrawer: () => set({ activeSession: null }),

  touchRefreshed: () => set({ lastRefreshedAt: new Date().toISOString() }),

  resetFilters: () =>
    set((state) => ({
      statusFilter: defaultState.statusFilter,
      venueFilter: defaultState.venueFilter,
      searchTerm: defaultState.searchTerm,
      viewMode: defaultState.viewMode,
      presetRange: defaultState.presetRange,
      selectedDate: state.selectedDate,
    })),

  resetAll: () => set({ ...defaultState }),
}));

export default useSchedulingReportStore;
