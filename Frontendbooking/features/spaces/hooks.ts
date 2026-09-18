'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getPublicSpaceTypes,
  getPublicSpaces,
  getPublicSpaceDetail,
  type SpaceFilterParams,
} from './api';

export function usePublicSpaceTypes() {
  return useQuery({
    queryKey: queryKeys.spaces.public.types(),
    queryFn: ({ signal }) => getPublicSpaceTypes(signal),
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function usePublicSpaces(filters: SpaceFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.spaces.public.list(filters),
    queryFn: ({ signal }) => getPublicSpaces(filters, signal),
  });
}

export function usePublicSpace(id: number) {
  return useQuery({
    queryKey: queryKeys.spaces.public.detail(id),
    queryFn: ({ signal }) => getPublicSpaceDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  });
}
