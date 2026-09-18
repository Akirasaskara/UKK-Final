'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  getProfile,
  login,
  registerAdmin,
  registerMember,
} from '@/features/auth/api';
import type {
  AuthProfile,
  LoginInput,
  RegisterAdminInput,
  RegisterMemberInput,
} from '@/features/auth/schemas';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { z } from 'zod';

function profileDestination(profile: AuthProfile): '/member' | '/admin' {
  return profile.role === 'member' ? '/member' : '/admin';
}

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.session.profile(),
    queryFn: ({ signal }) => getProfile(signal),
    enabled,
    staleTime: 0,
  });
}

export function useLoginMutation(returnTo?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.session.profile(), profile);
      const fallback = profileDestination(profile);
      const destination =
        returnTo && isAllowedReturnTo(returnTo, profile.role)
          ? returnTo
          : fallback;
      router.replace(destination);
      router.refresh();
    },
  });
}

export function useRegisterMemberMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterMemberInput) => registerMember(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.session.profile(), profile);
      router.replace('/member');
      router.refresh();
    },
  });
}

export function useRegisterAdminMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterAdminInput) => registerAdmin(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.session.profile(), profile);
      router.replace('/admin');
      router.refresh();
    },
  });
}

export function useLogoutMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/api/auth/logout', {}, z.null()),
    onSettled: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    },
  });
}

function isAllowedReturnTo(
  path: string,
  role: AuthProfile['role'],
): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (role === 'member') return path === '/member' || path.startsWith('/member/');
  return path === '/admin' || path.startsWith('/admin/');
}
