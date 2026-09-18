'use client';

import { useState } from 'react';
import { QrCode, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useBookingDetail, useCancelBookingMutation } from '../hooks';
import { formatReservationStatus } from '../status';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicContainer } from '@/components/public/public-container';
import Link from 'next/link';

export function BookingDetailContent({ bookingId }: { bookingId: number }) {
  const { data: booking, isLoading, isError, error, refetch } = useBookingDetail(bookingId);
  const cancelMutation = useCancelBookingMutation();

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  if (isLoading) {
    return (
      <PublicContainer className="py-12 max-w-2xl space-y-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full rounded-card" />
      </PublicContainer>
    );
  }

  if (isError || !booking) {
    return (
      <PublicContainer className="py-16 max-w-md mx-auto">
        <InlineAlert title="Booking Tidak Ditemukan" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Reservasi tidak ditemukan atau milik akun lain.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand"
            >
              Coba Lagi
            </button>
          </div>
        </InlineAlert>
      </PublicContainer>
    );
  }

  const statusInfo = formatReservationStatus(booking.status);
  const canCancel = booking.status === 'belum_dikonfirm' || booking.status === 'disetujui';

  async function handleCancel() {
    try {
      await cancelMutation.mutateAsync(bookingId);
      setConfirmCancelOpen(false);
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <PublicContainer className="py-8 sm:py-12 max-w-2xl space-y-6">
      <Link
        href="/member/bookings"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        <span>Kembali ke Daftar Booking</span>
      </Link>

      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6">
        {/* Header Kode & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-default pb-4">
          <div>
            <p className="text-xs text-text-muted">Kode Booking</p>
            <p className="font-mono text-base font-bold text-text-primary">
              {booking.kode_booking}
            </p>
          </div>
          <div>
            <span className={`rounded-badge px-3 py-1 text-xs font-semibold ${statusInfo.badgeStyle}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Info Ruangan */}
        <div className="space-y-1">
          <p className="text-xs text-text-muted">Ruangan / Space</p>
          <h1 className="font-ui text-xl font-bold text-text-primary">
            {booking.space?.nama_space ?? 'Workspace Ruang Kerja'}
          </h1>
        </div>

        {/* Detail Jadwal */}
        <div className="rounded-control border border-border-default bg-bg-subtle p-4 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-text-muted">Tanggal:</span>
            <span className="font-semibold">{formatDateIndonesia(booking.tanggal_reservasi)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Jam Penggunaan:</span>
            <span className="font-semibold">{booking.jam_mulai} – {booking.jam_selesai} WIB ({booking.durasi_jam} jam)</span>
          </div>
          <div className="flex justify-between border-t border-border-default pt-2 text-sm font-bold text-text-primary">
            <span>Total Pembayaran:</span>
            <span className="tabular-nums text-action-primary text-base">{formatIdr(booking.total_bayar)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {booking.status !== 'dibatalkan' ? (
            <Link
              href={`/member/bookings/${booking.id}/ticket`}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-action-primary px-4 py-3 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
            >
              <QrCode size={18} aria-hidden="true" />
              <span>Lihat & Cetak E-Ticket</span>
            </Link>
          ) : null}

          {canCancel ? (
            <button
              type="button"
              onClick={() => setConfirmCancelOpen(true)}
              className="w-full text-center text-xs font-semibold text-status-danger-text hover:underline py-2"
            >
              Batalkan Reservasi Ini
            </button>
          ) : null}
        </div>
      </div>

      {/* Dialog Konfirmasi Pembatalan */}
      {confirmCancelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="rounded-card border border-border-default bg-bg-surface p-6 max-w-md w-full shadow-modal space-y-4">
            <div className="flex items-center gap-2 text-status-danger-text font-bold text-base">
              <AlertTriangle size={20} aria-hidden="true" />
              <span>Batalkan Booking {booking.kode_booking}?</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Tindakan ini akan membatalkan pemesanan dan melepaskan slot jadwal ruangan ke katalog publik.
            </p>

            {cancelMutation.isError ? (
              <InlineAlert title="Gagal membatalkan" variant="danger">
                <p className="text-xs mt-1">
                  {cancelMutation.error instanceof Error ? cancelMutation.error.message : 'Terjadi kendala.'}
                </p>
              </InlineAlert>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => setConfirmCancelOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={handleCancel}
                className="inline-flex min-h-10 items-center justify-center rounded-control bg-status-danger-text px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PublicContainer>
  );
}
