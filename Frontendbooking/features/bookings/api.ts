import { apiClient } from '@/lib/api/client';
import {
  createdBookingResultSchema,
  memberBookingListSchema,
  bookingDetailSchema,
  eTicketSchema,
  cancelBookingResultSchema,
  type CreateBookingInput,
  type CreatedBookingResult,
  type MemberBookingSummary,
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

export function getBookingDetail(id: number, signal?: AbortSignal): Promise<BookingDetail> {
  return apiClient.get(`/api/member/bookings/${id}`, bookingDetailSchema, { signal });
}

export function cancelBooking(id: number): Promise<CancelBookingResult> {
  return apiClient.patch(`/api/member/bookings/${id}/cancel`, {}, cancelBookingResultSchema);
}

export function getBookingETicket(id: number, signal?: AbortSignal): Promise<ETicketData> {
  return apiClient.get(`/api/member/bookings/${id}/ticket`, eTicketSchema, { signal });
}
