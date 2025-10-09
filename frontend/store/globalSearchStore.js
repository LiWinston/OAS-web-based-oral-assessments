import { create } from "zustand";

export const useGlobalSearchStore = create((set) => ({
  isOpen: false,
  query: "",
  loading: false,
  error: "",
  sections: [],
  lastFetchedKey: null,
  lastFetchedAt: 0,
  setOpen: (isOpen) => set({ isOpen }),
  setQuery: (query) => set({ query }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSections: (sections) =>
    set((state) => ({
      sections: typeof sections === "function" ? sections(state.sections) : sections,
    })),
  setLastFetchedKey: (lastFetchedKey) => set({ lastFetchedKey }),
  setLastFetchedAt: (ts) => set({ lastFetchedAt: ts || Date.now() }),
  reset: () => set({ query: "", isOpen: false }),
}));
