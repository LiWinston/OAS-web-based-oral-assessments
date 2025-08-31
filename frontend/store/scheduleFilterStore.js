"use client";
import { create } from 'zustand';

export const useScheduleFilterStore = create((set) => ({
  selectedCourse: '',
  assessmentType: 'ALL', // ALL | INDIVIDUAL | GROUP | MIX
  searchText: '',
  dateFrom: null,
  dateTo: null,
  setSelectedCourse: (val) => set({ selectedCourse: val }),
  setAssessmentType: (val) => set({ assessmentType: val }),
  setSearchText: (val) => set({ searchText: val }),
  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),
  clearFilters: () => set({ selectedCourse: '', assessmentType: 'ALL', searchText: '', dateFrom: null, dateTo: null }),
}));

export default useScheduleFilterStore;

