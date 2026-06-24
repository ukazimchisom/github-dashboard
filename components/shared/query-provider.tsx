"use client";

// TanStack Query requires a QueryClient and QueryClientProvider
// This MUST be a Client Component (providers use React context)
// i wrap this in its own file to keep layout.tsx clean

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { QUERY_STALE_TIME } from "@/config/constants";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // useState ensures each user gets their own QueryClient
  // If we created it outside the component, it would be shared
  // across all users in server-side rendering (security issue)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            // Within this time, no re-fetches happen
            staleTime: QUERY_STALE_TIME,

            // Retry failed requests 1 time before showing error
            retry: 1,

            // Don't re-fetch when user switches browser tabs
            // (we have a manual sync button for fresh data)
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only appear in development, not production */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
