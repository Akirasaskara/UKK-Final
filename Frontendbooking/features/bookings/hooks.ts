'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getMyBookings,
  getMyHistory,
  getBookingDetail,
  getBookingETicket,
  createBooking,
  cancelBooking,
} from './api';
import type { CreateBookingInput } from './schemas';

export function useMyBookings() {
  return useQuery({
    queryKey: queryKeys.member.bookings.list(),
    queryFn: ({ signal }) => getMyBookings(signal),
  });
}

export function useMyHistory(params: {
  month: number;
  year: number;
  page: number;
  limit: number;
}) {
  return useQuery({
    queryKey: queryKeys.member.bookings.history(params),
    queryFn: ({ signal }) => getMyHistory(params, signal),
    staleTime: 0,
  });
}

export function useBookingDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.member.bookings.detail(id),
    queryFn: ({ signal }) => getBookingDetail(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useBookingETicket(id: number) {
  return useQuery({
    queryKey: queryKeys.member.bookings.ticket(id),
    queryFn: ({ signal }) => getBookingETicket(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.member.bookings.list() });
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelBooking(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.member.bookings.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.member.bookings.detail(id) });
    },
  });
}
