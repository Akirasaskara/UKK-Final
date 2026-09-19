import { apiClient } from '@/lib/api/client';
import {
  adminSpaceListResultSchema,
  adminSpaceDetailSchema,
  adminSpaceMutationResultSchema,
  archiveSpaceResultSchema,
  spaceUploadResultSchema,
  type AdminSpaceListResult,
  type AdminSpaceDetail,
  type AdminSpaceMutationResult,
  type ArchiveSpaceResult,
  type SpaceUploadResult,
  type SpaceFormInput,
} from './schemas';
import { ApiError } from '@/lib/api/errors';

export type AdminSpaceFilterParams = {
  tipe?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export function getAdminSpaces(
  params: AdminSpaceFilterParams = {},
  signal?: AbortSignal,
): Promise<AdminSpaceListResult> {
  const query = new URLSearchParams();
  if (params.tipe) query.set('tipe', params.tipe);
  if (params.search && params.search.trim().length > 0) {
    query.set('search', params.search.trim());
  }
  if (params.page && params.page > 0) {
    query.set('page', params.page.toString());
  }
  if (params.limit && params.limit > 0) {
    query.set('limit', params.limit.toString());
  }

  const qs = query.toString();
  const url = qs ? `/api/admin/spaces?${qs}` : '/api/admin/spaces';

  return apiClient.get(url, adminSpaceListResultSchema, { signal });
}

export function getAdminSpaceDetail(
  id: number,
  signal?: AbortSignal,
): Promise<AdminSpaceDetail> {
  return apiClient.get(`/api/admin/spaces/${id}`, adminSpaceDetailSchema, { signal });
}

export function createAdminSpace(
  input: SpaceFormInput,
): Promise<AdminSpaceMutationResult> {
  return apiClient.post('/api/admin/spaces', input, adminSpaceMutationResultSchema);
}

export function updateAdminSpace(
  id: number,
  input: Partial<SpaceFormInput> & { expected_version?: number },
): Promise<AdminSpaceMutationResult> {
  return apiClient.put(`/api/admin/spaces/${id}`, input, adminSpaceMutationResultSchema);
}

export function deleteAdminSpace(id: number): Promise<ArchiveSpaceResult> {
  return apiClient.delete(`/api/admin/spaces/${id}`, archiveSpaceResultSchema);
}

export async function uploadSpacePhoto(
  file: File,
  signal?: AbortSignal,
): Promise<SpaceUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/uploads/spaces', {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  const resJson = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: response.status === 401 ? 'unauthorized' : 'validation',
      message: resJson?.message || 'Gagal mengunggah foto space.',
    });
  }

  const parsed = spaceUploadResultSchema.safeParse(resJson?.data);
  if (!parsed.success) {
    throw new ApiError({
      status: response.status,
      code: 'contract',
      message: 'Format respon unggah foto tidak valid.',
    });
  }

  return parsed.data;
}
