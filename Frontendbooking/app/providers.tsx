'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let browserQueryClient: QueryClient | undefined;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount: number, error: unknown) => {
          if (failureCount >= 2) return false;
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as { status: number }).status;
            if ([400, 401, 403, 404, 409, 413, 422, 429].includes(status)) {
              return false;
            }
          }
          return true;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
