import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import {
  createdBookingResultSchema,
  memberBookingListSchema,
  memberHistorySchema,
  bookingDetailSchema,
  eTicketSchema,
  cancelBookingResultSchema,
  type CreateBookingInput,
  type CreatedBookingResult,
  type MemberBookingSummary,
  type MemberHistory,
  type BookingDetail,
  type ETicketData,
  type CancelBookingResult,
} from './schemas';

export function createBooking(input: CreateBookingInput): Promise<CreatedBookingResult> {
  return apiClient.post('/api/member/bookings', input, createdBookingResultSchema);
}

export function getMyBookings(signal?: AbortSignal): Promise<MemberBookingSummary[]> {
  return apiClient.get('/api/member/bookings', memberBookingListSchema, { signal });
}

export function getMyHistory(
  params: { month: number; year: number; page: number; limit: number },
  signal?: AbortSignal,
): Promise<MemberHistory & { page: number; limit: number }> {
  const query = new URLSearchParams({
    month: String(params.month),
    year: String(params.year),
    page: String(params.page),
    limit: String(params.limit),
  });
  return apiClient.get(
    `/api/member/history?${query.toString()}`,
    memberHistorySchema.extend({
      page: z.number().int().positive(),
      limit: z.number().int().min(1).max(100),
    }),
    { signal },
  );
}

export function getBookingDetail(id: number, signal?: AbortSignal): Promise<BookingDetail> {
  return apiClient.get(`/api/member/bookings/${id}`, bookingDetailSchema, { signal });
}

export function cancelBooking(id: number): Promise<CancelBookingResult> {
  return apiClient.patch(`/api/member/bookings/${id}/cancel`, {}, cancelBookingResultSchema);
}

export function getBookingETicket(id: number, signal?: AbortSignal): Promise<ETicketData> {
  return apiClient.get(`/api/member/bookings/${id}/ticket`, eTicketSchema, { signal });
}
