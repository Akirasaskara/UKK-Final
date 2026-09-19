'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getAdminMembers,
  getAdminMemberDetail,
  createMemberAssisted,
  uploadMemberPhoto,
  type AdminMemberFilterParams,
} from './api';
import type { CreateMemberAssistedInput } from './schemas';

export function useAdminMembers(params: AdminMemberFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.members.list(params.search),
    queryFn: ({ signal }) => getAdminMembers(params, signal),
  });
}

export function useAdminMemberDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.admin.members.detail(id),
    queryFn: ({ signal }) => getAdminMemberDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateMemberAssistedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMemberAssistedInput) => createMemberAssisted(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
    },
  });
}

export function useUploadMemberPhotoMutation() {
  return useMutation({
    mutationFn: (file: File) => uploadMemberPhoto(file),
  });
}
