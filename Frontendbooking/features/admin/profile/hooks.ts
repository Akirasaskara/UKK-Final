'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { getAdminProfile, updateAdminProfile } from './api';
import type { UpdateAdminProfileInput } from './schemas';

export function useAdminProfile() {
  return useQuery({
    queryKey: queryKeys.admin.profile(),
    queryFn: ({ signal }) => getAdminProfile(signal),
  });
}

export function useUpdateAdminProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAdminProfileInput) => updateAdminProfile(input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.admin.profile(), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.session.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.profile() });
    },
  });
}
