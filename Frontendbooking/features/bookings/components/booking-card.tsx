import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { MemberBookingSummary } from '../schemas';
import { formatReservationStatus } from '../status';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import { formatSpaceType } from '@/lib/format/space';

export function BookingCard({ booking }: { booking: MemberBookingSummary }) {
  const statusInfo = formatReservationStatus(booking.status);

  return (
    <article className="flex flex-col justify-between rounded-card border border-border-default bg-bg-surface p-5 shadow-card space-y-4 hover:border-border-strong transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs font-bold text-text-muted">
            {booking.kode_booking}
          </span>
          <span className={`rounded-badge px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.badgeStyle}`}>
            {statusInfo.label}
          </span>
        </div>

        <div>
          <h3 className="font-ui text-lg font-bold text-text-primary">
            {booking.space?.nama_space ?? 'Workspace Space'}
          </h3>
          {booking.space ? (
            <p className="text-xs text-action-secondary font-medium">
              {formatSpaceType(booking.space.tipe)}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5 text-xs text-text-secondary border-t border-border-default pt-2.5">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-text-muted" aria-hidden="true" />
            <span>{formatDateIndonesia(booking.tanggal_reservasi)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-text-muted" aria-hidden="true" />
            <span>{booking.jam_mulai} – {booking.jam_selesai} WIB ({booking.durasi_jam} jam)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border-default pt-3">
        <div>
          <p className="text-[11px] text-text-muted">Total Bayar</p>
          <p className="font-ui text-sm font-bold text-text-primary tabular-nums">
            {formatIdr(booking.total_bayar)}
          </p>
        </div>

        <Link
          href={`/member/bookings/${booking.id}`}
          className="inline-flex items-center gap-1 rounded-control bg-bg-subtle px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-border-default transition-colors"
        >
          <span>Detail</span>
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
