"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DemoProvider } from "@/contexts/DemoContext";
import { useState } from "react";

// Create QueryClient with optimized default configuration
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 60 seconds by default
        staleTime: 60 * 1000,
        // Keep unused data in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Don't refetch on window focus (reduces API calls)
        refetchOnWindowFocus: false,
        // Refetch on mount if data is stale (ensures invalidated queries refresh on navigation)
        refetchOnMount: true,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Retry failed requests once
        retry: 1,
        // Wait 1 second before retry
        retryDelay: 1000,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
        // Wait 1 second before retry
        retryDelay: 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

// Singleton pattern for React Query client to avoid duplicate clients
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may
  // suspend because React will throw away the client on the initial
  // render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <DemoProvider>{children}</DemoProvider>
    </QueryClientProvider>
  );
}
