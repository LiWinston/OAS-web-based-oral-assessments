'use client';

import { useEffect } from 'react';
import useUIStore from '../store/uiStore';

/**
 * Custom hook for dark mode management
 * 
 * Provides a consistent interface for dark mode functionality
 * across the application, using the centralized UI store.
 */
export function useDarkMode() {
  const { darkMode, toggleDarkMode, setDarkMode, initializeDarkMode } = useUIStore();

  // Initialize dark mode on first load
  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  return {
    isDarkMode: darkMode,
    toggleDarkMode,
    setDarkMode,
  };
}
