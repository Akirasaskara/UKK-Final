import { apiClient } from '@/lib/api/client';
import {
  adminMemberListResultSchema,
  adminMemberDetailSchema,
  createdMemberAssistedResultSchema,
  memberUploadResultSchema,
  type AdminMemberListResult,
  type AdminMemberDetail,
  type CreateMemberAssistedInput,
  type CreatedMemberAssistedResult,
  type MemberUploadResult,
} from './schemas';
import { ApiError } from '@/lib/api/errors';

export type AdminMemberFilterParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export function getAdminMembers(
  params: AdminMemberFilterParams = {},
  signal?: AbortSignal,
): Promise<AdminMemberListResult> {
  const query = new URLSearchParams();
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
  const url = qs ? `/api/admin/members?${qs}` : '/api/admin/members';

  return apiClient.get(url, adminMemberListResultSchema, { signal });
}

export function getAdminMemberDetail(
  id: number,
  signal?: AbortSignal,
): Promise<AdminMemberDetail> {
  return apiClient.get(`/api/admin/members/${id}`, adminMemberDetailSchema, { signal });
}

export function createMemberAssisted(
  input: CreateMemberAssistedInput,
): Promise<CreatedMemberAssistedResult> {
  return apiClient.post('/api/admin/members', input, createdMemberAssistedResultSchema);
}

export async function uploadMemberPhoto(
  file: File,
  signal?: AbortSignal,
): Promise<MemberUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/uploads/members', {
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
      message: resJson?.message || 'Gagal mengunggah foto profil member.',
    });
  }

  const parsed = memberUploadResultSchema.safeParse(resJson?.data);
  if (!parsed.success) {
    throw new ApiError({
      status: response.status,
      code: 'contract',
      message: 'Format respon unggah foto tidak valid.',
    });
  }

  return parsed.data;
}
