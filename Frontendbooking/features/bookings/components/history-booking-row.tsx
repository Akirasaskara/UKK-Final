import Link from 'next/link';
import type { MemberHistoryItem } from '../schemas';
import { formatReservationStatus } from '../status';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';

export function HistoryBookingRow({ booking }: { booking: MemberHistoryItem }) {
  const status = formatReservationStatus(booking.status);

  return (
    <article className="grid gap-4 border-b border-border-default py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs font-bold text-text-muted">{booking.kode_booking}</p>
          <span className={`rounded-badge px-2.5 py-1 text-xs font-semibold ${status.badgeStyle}`}>
            {status.label}
          </span>
        </div>
        <h3 className="mt-2 font-ui text-base font-bold text-text-primary sm:text-lg">
          {booking.space_name || 'Space tidak tersedia'}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {formatDateIndonesia(booking.tanggal_reservasi)}, {booking.jam_mulai}–{booking.jam_selesai} WIB
          <span className="text-text-muted"> · {booking.durasi_jam} jam</span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <div className="sm:text-right">
          <p className="text-xs text-text-muted">Total bayar</p>
          <p className="mt-1 font-ui text-sm font-bold tabular-nums text-text-primary">
            {formatIdr(booking.total_bayar)}
          </p>
        </div>
        <Link
          href={`/member/bookings/${booking.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-control border border-border-strong px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
        >
          Buka detail
        </Link>
      </div>
    </article>
  );
}
