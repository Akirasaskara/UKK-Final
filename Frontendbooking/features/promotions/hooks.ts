'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { getActivePromotions } from './api';

export function useActivePromotions() {
  return useQuery({
    queryKey: queryKeys.discounts.publicActive(),
    queryFn: ({ signal }) => getActivePromotions(signal),
    staleTime: 1000 * 60 * 2, // 2 menit
  });
}
