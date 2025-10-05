"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Safe storage factory for SSR: falls back to in-memory shim when window is undefined
const storageFactory = () => {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
};

export const useSessionMetaStore = create(
  persist(
    (set, get) => ({
      metaByKey: {},
      setSessionMeta: (assignmentId, sessionId, meta) => {
        const key = `${assignmentId}:${sessionId}`;
        set((state) => ({ metaByKey: { ...state.metaByKey, [key]: meta } }));
      },
      getSessionMeta: (assignmentId, sessionId) => {
        const key = `${assignmentId}:${sessionId}`;
        return get().metaByKey[key] || null;
      },
      clear: () => set({ metaByKey: {} }),
    }),
    {
      name: "examiner-session-meta",
      storage: createJSONStorage(storageFactory),
      version: 1,
    }
  )
);

