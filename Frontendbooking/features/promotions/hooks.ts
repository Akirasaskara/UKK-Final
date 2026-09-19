'use client';

import { useQuery } from '@tanstack/react-query';
import { getActivePromotions } from './api';

export function useActivePromotions(params: { id_space?: number } = {}) {
  return useQuery({
    queryKey: ['discounts', 'public', 'active', params],
    queryFn: ({ signal }) => getActivePromotions(params, signal),
    staleTime: 1000 * 60 * 2, // 2 menit
  });
}
