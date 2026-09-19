import { apiClient } from '@/lib/api/client';
import {
  adminReservationListSchema,
  updateStatusResultSchema,
  checkInResultSchema,
  checkOutResultSchema,
  qrVerificationResultSchema,
  type AdminReservationListItem,
  type UpdateStatusResult,
  type CheckInResult,
  type CheckOutResult,
  type QrVerificationResult,
} from './schemas';
import {
  bookingDetailSchema,
  type BookingDetail,
} from '@/features/bookings/schemas';

export type AdminReservationFilterParams = {
  status?: string;
  tanggal?: string;
  id_space?: number;
  month?: number;
  year?: number;
};

export function getAdminReservations(
  filters: AdminReservationFilterParams = {},
  signal?: AbortSignal,
): Promise<AdminReservationListItem[]> {
  const query = new URLSearchParams();
  if (filters.status) query.set('status', filters.status);
  if (filters.tanggal) query.set('tanggal', filters.tanggal);
  if (filters.id_space) query.set('id_space', filters.id_space.toString());
  if (filters.month) query.set('month', filters.month.toString());
  if (filters.year) query.set('year', filters.year.toString());

  const qs = query.toString();
  const url = qs ? `/api/admin/reservations?${qs}` : '/api/admin/reservations';

  return apiClient.get(url, adminReservationListSchema, { signal });
}

export function getAdminReservationDetail(
  id: number,
  signal?: AbortSignal,
): Promise<BookingDetail> {
  return apiClient.get(`/api/admin/reservations/${id}`, bookingDetailSchema, { signal });
}

export function updateAdminReservationStatus(
  id: number,
  status: 'disetujui' | 'dibatalkan',
): Promise<UpdateStatusResult> {
  return apiClient.patch(
    `/api/admin/reservations/${id}/status`,
    { status },
    updateStatusResultSchema,
  );
}

export function checkInAdminReservation(id: number): Promise<CheckInResult> {
  return apiClient.post(
    `/api/admin/reservations/${id}/check-in`,
    {},
    checkInResultSchema,
  );
}

export function checkOutAdminReservation(id: number): Promise<CheckOutResult> {
  return apiClient.post(
    `/api/admin/reservations/${id}/check-out`,
    {},
    checkOutResultSchema,
  );
}

export function verifyTicketCode(token: string): Promise<QrVerificationResult> {
  return apiClient.post(
    '/api/admin/reservations/verify-code',
    { token },
    qrVerificationResultSchema,
  );
}
