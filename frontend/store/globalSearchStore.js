import { create } from "zustand";

export const useGlobalSearchStore = create((set) => ({
  isOpen: false,
  query: "",
  loading: false,
  error: "",
  sections: [],
  lastFetchedKey: null,
  setOpen: (isOpen) => set({ isOpen }),
  setQuery: (query) => set({ query }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSections: (sections) => set({ sections }),
  setLastFetchedKey: (lastFetchedKey) => set({ lastFetchedKey }),
  reset: () => set({ query: "", isOpen: false }),
}));
