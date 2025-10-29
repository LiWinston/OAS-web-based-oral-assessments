"use client";

import { create } from "zustand";

const defaultState = {
  assignmentId: "",
  status: "SUBMITTED",
  minSessions: "0",
  sortBy: "averageScore",
  sortDirection: "desc",
};

export const useExaminerTrendReportStore = create((set) => ({
  ...defaultState,

  setAssignmentId: (assignmentId) =>
    set((state) => ({
      assignmentId,
      sortBy: state.sortBy,
      sortDirection: state.sortDirection,
    })),

  setStatus: (status) => set({ status }),

  setMinSessions: (value) => set({ minSessions: value }),

  setSort: (sortBy, sortDirection) => set({ sortBy, sortDirection }),

  reset: () => set({ ...defaultState }),
}));

export default useExaminerTrendReportStore;
