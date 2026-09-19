'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { getDashboardSummary } from './api';

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: ({ signal }) => getDashboardSummary(signal),
    staleTime: 1000 * 30, // 30 detik
  });
}
