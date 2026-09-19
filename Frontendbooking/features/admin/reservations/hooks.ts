'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getAdminReservations,
  getAdminReservationDetail,
  updateAdminReservationStatus,
  checkInAdminReservation,
  checkOutAdminReservation,
  verifyTicketCode,
  type AdminReservationFilterParams,
} from './api';

export function useAdminReservations(filters: AdminReservationFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.reservations.list(filters),
    queryFn: ({ signal }) => getAdminReservations(filters, signal),
  });
}

export function useAdminReservationDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.admin.reservations.detail(id),
    queryFn: ({ signal }) => getAdminReservationDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useUpdateReservationStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: 'disetujui' | 'dibatalkan';
    }) => updateAdminReservationStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reservations.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reservations.detail(vars.id) });
    },
  });
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => checkInAdminReservation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reservations.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reservations.detail(id) });
    },
  });
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => checkOutAdminReservation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reservations.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reservations.detail(id) });
    },
  });
}

export function useVerifyTicketMutation() {
  return useMutation({
    mutationFn: (token: string) => verifyTicketCode(token),
  });
}
