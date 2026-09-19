'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getAdminPromotions,
  getAdminPromotionDetail,
  createAdminPromotion,
  updateAdminPromotion,
  deleteAdminPromotion,
  type AdminPromotionFilterParams,
} from './api';
import type { PromotionFormInput } from './schemas';

export function useAdminPromotions(params: AdminPromotionFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.discounts.list(),
    queryFn: ({ signal }) => getAdminPromotions(params, signal),
  });
}

export function useAdminPromotion(id: number) {
  return useQuery({
    queryKey: queryKeys.admin.discounts.detail(id),
    queryFn: ({ signal }) => getAdminPromotionDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreatePromotionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PromotionFormInput) => createAdminPromotion(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.discounts.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.publicActive() });
      queryClient.setQueryData(queryKeys.admin.discounts.detail(data.id), data);
    },
  });
}

export function useUpdatePromotionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: Partial<PromotionFormInput> & { expected_version?: number };
    }) => updateAdminPromotion(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.discounts.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.discounts.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.publicActive() });
      queryClient.setQueryData(queryKeys.admin.discounts.detail(variables.id), data);
    },
  });
}

export function useArchivePromotionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminPromotion(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.discounts.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.discounts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.discounts.publicActive() });
    },
  });
}
