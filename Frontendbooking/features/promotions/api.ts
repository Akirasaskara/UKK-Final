import { apiClient } from '@/lib/api/client';
import {
  activePromotionListSchema,
  type ActivePromotion,
} from './schemas';

export function getActivePromotions(
  params: { id_space?: number } = {},
  signal?: AbortSignal,
): Promise<ActivePromotion[]> {
  const query = new URLSearchParams();
  if (params.id_space && params.id_space > 0) {
    query.set('id_space', params.id_space.toString());
  }

  const qs = query.toString();
  const url = qs ? `/api/public/promotions?${qs}` : '/api/public/promotions';

  return apiClient.get(url, activePromotionListSchema, { signal });
}
