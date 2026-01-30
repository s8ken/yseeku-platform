"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DemoProvider } from "@/contexts/DemoContext";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoProvider>{children}</DemoProvider>
    </QueryClientProvider>
  );
}
