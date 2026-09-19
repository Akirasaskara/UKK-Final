import type { ReservationStatus } from '@/features/bookings/schemas';

export type AdminLegalAction = 'approve' | 'cancel' | 'check_in' | 'check_out';

export function getLegalActionsForStatus(status: ReservationStatus): AdminLegalAction[] {
  switch (status) {
    case 'belum_dikonfirm':
      return ['approve', 'cancel'];
    case 'disetujui':
      return ['check_in', 'cancel'];
    case 'aktif':
      return ['check_out'];
    case 'selesai':
    case 'dibatalkan':
    default:
      return [];
  }
}
