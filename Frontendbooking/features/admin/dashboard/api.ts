import { apiClient } from '@/lib/api/client';
import {
  dashboardSummarySchema,
  type DashboardSummary,
} from './schemas';

export function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return apiClient.get('/api/admin/dashboard', dashboardSummarySchema, { signal });
}
