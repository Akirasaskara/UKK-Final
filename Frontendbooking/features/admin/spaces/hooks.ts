'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getAdminSpaces,
  getAdminSpaceDetail,
  createAdminSpace,
  updateAdminSpace,
  deleteAdminSpace,
  uploadSpacePhoto,
  type AdminSpaceFilterParams,
} from './api';
import type { SpaceFormInput } from './schemas';

export function useAdminSpaces(params: AdminSpaceFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.spaces.list(),
    queryFn: ({ signal }) => getAdminSpaces(params, signal),
  });
}

export function useAdminSpace(id: number) {
  return useQuery({
    queryKey: queryKeys.admin.spaces.detail(id),
    queryFn: ({ signal }) => getAdminSpaceDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateSpaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SpaceFormInput) => createAdminSpace(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.spaces.list() });
      queryClient.invalidateQueries({ queryKey: ['spaces', 'public'] });
      queryClient.setQueryData(queryKeys.admin.spaces.detail(data.id), data);
    },
  });
}

export function useUpdateSpaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: Partial<SpaceFormInput> & { expected_version?: number };
    }) => updateAdminSpace(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.spaces.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.spaces.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['spaces', 'public'] });
      queryClient.setQueryData(queryKeys.admin.spaces.detail(variables.id), data);
    },
  });
}

export function useArchiveSpaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminSpace(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.spaces.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.spaces.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['spaces', 'public'] });
    },
  });
}

export function useUploadSpacePhotoMutation() {
  return useMutation({
    mutationFn: (file: File) => uploadSpacePhoto(file),
  });
}
