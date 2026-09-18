import { apiClient } from '@/lib/api/client';
import {
  activePromotionListSchema,
  type ActivePromotion,
} from './schemas';

export function getActivePromotions(signal?: AbortSignal): Promise<ActivePromotion[]> {
  return apiClient.get('/api/public/promotions', activePromotionListSchema, { signal });
}
