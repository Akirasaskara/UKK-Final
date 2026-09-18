import type { ReservationStatus } from './schemas';

export const reservationStatusConfig: Record<
  ReservationStatus,
  { label: string; badgeStyle: string }
> = {
  belum_dikonfirm: {
    label: 'Menunggu Konfirmasi',
    badgeStyle: 'bg-[var(--amber-50)] text-[var(--amber-800)] border border-[var(--amber-800)]/30',
  },
  disetujui: {
    label: 'Disetujui',
    badgeStyle: 'bg-[var(--cyan-50)] text-[var(--cyan-700)] border border-[var(--cyan-700)]/30',
  },
  aktif: {
    label: 'Sedang Digunakan',
    badgeStyle: 'bg-[var(--green-50)] text-[var(--green-700)] border border-[var(--green-700)]/30',
  },
  selesai: {
    label: 'Selesai',
    badgeStyle: 'bg-bg-subtle text-text-muted border border-border-default',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    badgeStyle: 'bg-[var(--red-50)] text-[var(--red-700)] border border-[var(--red-700)]/30',
  },
};

export function formatReservationStatus(status: ReservationStatus): {
  label: string;
  badgeStyle: string;
} {
  return (
    reservationStatusConfig[status] ?? {
      label: status,
      badgeStyle: 'bg-bg-subtle text-text-muted border border-border-default',
    }
  );
}
