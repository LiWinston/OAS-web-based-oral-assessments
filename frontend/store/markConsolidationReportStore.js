"use client";

import { create } from "zustand";

const defaultState = {
  assignmentId: "",
  releaseFilter: "all",
  progressFilter: "all",
  sessionId: "all",
  searchTerm: "",
  sortBy: "participant",
  sortDirection: "asc",
  lastRefreshedAt: null,
};

export const useMarkConsolidationReportStore = create((set) => ({
  ...defaultState,

  setAssignmentId: (assignmentId) =>
    set(() => ({
      assignmentId,
      releaseFilter: defaultState.releaseFilter,
      progressFilter: defaultState.progressFilter,
      sessionId: defaultState.sessionId,
      searchTerm: defaultState.searchTerm,
      sortBy: defaultState.sortBy,
      sortDirection: defaultState.sortDirection,
    })),

  setReleaseFilter: (releaseFilter) => set({ releaseFilter }),

  setProgressFilter: (progressFilter) => set({ progressFilter }),

  setSessionId: (sessionId) => set({ sessionId }),

  setSearchTerm: (searchTerm) => set({ searchTerm }),

  setSort: (sortBy, sortDirection) => set({ sortBy, sortDirection }),

  touchRefreshed: () => set({ lastRefreshedAt: new Date().toISOString() }),

  resetFilters: () =>
    set((state) => ({
      releaseFilter: defaultState.releaseFilter,
      progressFilter: defaultState.progressFilter,
      sessionId: defaultState.sessionId,
      searchTerm: defaultState.searchTerm,
      sortBy: defaultState.sortBy,
      sortDirection: defaultState.sortDirection,
      assignmentId: state.assignmentId,
    })),

  resetAll: () => set({ ...defaultState }),
}));

export default useMarkConsolidationReportStore;
