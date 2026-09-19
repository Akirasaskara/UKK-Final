import { apiClient } from '@/lib/api/client';
import {
  adminPromotionListResultSchema,
  adminPromotionDetailSchema,
  adminPromotionMutationResultSchema,
  archivePromotionResultSchema,
  type AdminPromotionListResult,
  type AdminPromotionDetail,
  type AdminPromotionMutationResult,
  type ArchivePromotionResult,
  type PromotionFormInput,
} from './schemas';

export type AdminPromotionFilterParams = {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export function getAdminPromotions(
  params: AdminPromotionFilterParams = {},
  signal?: AbortSignal,
): Promise<AdminPromotionListResult> {
  const query = new URLSearchParams();
  if (params.search && params.search.trim().length > 0) {
    query.set('search', params.search.trim());
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.page && params.page > 0) {
    query.set('page', params.page.toString());
  }
  if (params.limit && params.limit > 0) {
    query.set('limit', params.limit.toString());
  }

  const qs = query.toString();
  const url = qs ? `/api/admin/promotions?${qs}` : '/api/admin/promotions';

  return apiClient.get(url, adminPromotionListResultSchema, { signal });
}

export function getAdminPromotionDetail(
  id: number,
  signal?: AbortSignal,
): Promise<AdminPromotionDetail> {
  return apiClient.get(`/api/admin/promotions/${id}`, adminPromotionDetailSchema, { signal });
}

export function createAdminPromotion(
  input: PromotionFormInput,
): Promise<AdminPromotionMutationResult> {
  return apiClient.post('/api/admin/promotions', input, adminPromotionMutationResultSchema);
}

export function updateAdminPromotion(
  id: number,
  input: Partial<PromotionFormInput> & { expected_version?: number },
): Promise<AdminPromotionMutationResult> {
  return apiClient.put(`/api/admin/promotions/${id}`, input, adminPromotionMutationResultSchema);
}

export function deleteAdminPromotion(id: number): Promise<ArchivePromotionResult> {
  return apiClient.delete(`/api/admin/promotions/${id}`, archivePromotionResultSchema);
}
