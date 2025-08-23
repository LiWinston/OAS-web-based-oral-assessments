"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

/**
 * Providers Component
 * 
 * Sets up React Query for server state management throughout the application.
 * Configures default options for queries and mutations including retry logic,
 * stale time, and error handling strategies.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with providers
 */
export function Providers({ children }) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors except 408 (Request Timeout), 429 (Too Many Requests)
              if (
                error?.response?.status >= 400 &&
                error?.response?.status < 500
              ) {
                if (
                  error?.response?.status === 408 ||
                  error?.response?.status === 429
                ) {
                  return failureCount < 3;
                }
                return false;
              }
              // Retry on network errors and 5xx errors
              return failureCount < 3;
            },
            refetchOnWindowFocus: false, // Disable refetch on window focus
          },
          mutations: {
            retry: (failureCount, error) => {
              // Don't retry mutations on 4xx errors
              if (
                error?.response?.status >= 400 &&
                error?.response?.status < 500
              ) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools for debugging in development */}
      <ReactQueryDevtools initialIsOpen={false} />
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
