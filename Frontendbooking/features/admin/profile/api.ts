import { apiClient } from '@/lib/api/client';
import {
  adminProfileSchema,
  type AdminProfile,
  type UpdateAdminProfileInput,
} from './schemas';

export function getAdminProfile(signal?: AbortSignal): Promise<AdminProfile> {
  return apiClient.get('/api/admin/profile', adminProfileSchema, { signal });
}

export function updateAdminProfile(
  input: UpdateAdminProfileInput,
): Promise<AdminProfile> {
  return apiClient.put('/api/admin/profile', input, adminProfileSchema);
}
