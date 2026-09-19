'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import {
  useAdminReservationDetail,
  useUpdateReservationStatusMutation,
  useCheckInMutation,
  useCheckOutMutation,
} from '../hooks';
import { getLegalActionsForStatus, type AdminLegalAction } from '../action-policy';
import { formatReservationStatus } from '@/features/bookings/status';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';

export function AdminReservationDetailPageContent({
  reservationId,
}: {
  reservationId: number;
}) {
  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminReservationDetail(reservationId);

  const statusMutation = useUpdateReservationStatusMutation();
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  const [dialogAction, setDialogAction] = useState<AdminLegalAction | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-80 w-full rounded-card" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="max-w-md">
        <InlineAlert title="Reservasi Tidak Ditemukan" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Data tidak ditemukan atau bukan milik coworking space Anda.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex min-h-10 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand"
            >
              Coba Lagi
            </button>
          </div>
        </InlineAlert>
      </div>
    );
  }

  const statusInfo = formatReservationStatus(booking.status);
  const legalActions = getLegalActionsForStatus(booking.status);

  const isPending =
    statusMutation.isPending ||
    checkInMutation.isPending ||
    checkOutMutation.isPending;

  async function handleExecuteAction() {
    if (!dialogAction) return;

    try {
      if (dialogAction === 'approve') {
        await statusMutation.mutateAsync({ id: reservationId, status: 'disetujui' });
      } else if (dialogAction === 'cancel') {
        await statusMutation.mutateAsync({ id: reservationId, status: 'dibatalkan' });
      } else if (dialogAction === 'check_in') {
        await checkInMutation.mutateAsync(reservationId);
      } else if (dialogAction === 'check_out') {
        await checkOutMutation.mutateAsync(reservationId);
      }
      setDialogAction(null);
    } catch {
      // Error is captured in mutation state
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/reservations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        <span>Kembali ke Antrean Reservasi</span>
      </Link>

      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6">
        {/* Header Kode & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-default pb-4">
          <div>
            <p className="text-xs text-text-muted">Kode Booking</p>
            <h1 className="font-mono text-xl font-bold text-text-primary">
              {booking.kode_booking}
            </h1>
          </div>
          <div>
            <span className={`rounded-badge px-3 py-1 text-xs font-semibold ${statusInfo.badgeStyle}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Member & Ruangan Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-control border border-border-default bg-bg-subtle p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <User size={14} aria-hidden="true" />
              Informasi Pemesan
            </p>
            <p className="font-bold text-sm text-text-primary">{booking.member?.nama_member ?? 'Member'}</p>
            <p className="text-xs text-text-secondary">Nomor Kontak: {booking.member?.telp ?? '-'}</p>
          </div>

          <div className="rounded-control border border-border-default bg-bg-subtle p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Building2 size={14} aria-hidden="true" />
              Ruangan / Space
            </p>
            <p className="font-bold text-sm text-text-primary">{booking.space?.nama_space ?? 'Space'}</p>
            <p className="text-xs text-text-secondary">Tarif Standar: {formatIdr(booking.space?.harga_per_jam ?? 0)} / jam</p>
          </div>
        </div>

        {/* Jadwal Penggunaan */}
        <div className="rounded-control border border-border-default bg-bg-surface p-4 space-y-2 text-xs">
          <p className="font-bold text-xs text-text-muted uppercase tracking-wider">Jadwal Reservasi</p>
          <div className="flex justify-between border-t border-border-default pt-2">
            <span className="text-text-muted">Tanggal:</span>
            <span className="font-semibold text-text-primary">{formatDateIndonesia(booking.tanggal_reservasi)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Jam Mulai – Selesai:</span>
            <span className="font-semibold text-text-primary">{booking.jam_mulai} – {booking.jam_selesai} WIB ({booking.durasi_jam} jam)</span>
          </div>
          <div className="flex justify-between border-t border-border-default pt-2 text-sm font-bold text-text-primary">
            <span>Total Pembayaran Layanan:</span>
            <span className="tabular-nums text-action-primary text-base">{formatIdr(booking.total_bayar)}</span>
          </div>
        </div>

        {/* Action Panel Matrix */}
        {legalActions.length > 0 ? (
          <div className="space-y-3 border-t border-border-default pt-4">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Aksi Operasional yang Diizinkan:
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {legalActions.includes('approve') ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDialogAction('approve')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-action-primary px-5 py-2.5 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>Setujui Reservasi</span>
                </button>
              ) : null}

              {legalActions.includes('check_in') ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDialogAction('check_in')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-status-success-text px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 shadow-sm disabled:opacity-50"
                >
                  <LogIn size={16} aria-hidden="true" />
                  <span>Proses Check-In Pelanggan</span>
                </button>
              ) : null}

              {legalActions.includes('check_out') ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDialogAction('check_out')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-action-primary px-5 py-2.5 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm disabled:opacity-50"
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>Selesaikan & Check-Out</span>
                </button>
              ) : null}

              {legalActions.includes('cancel') ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDialogAction('cancel')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control border border-status-danger-text/40 bg-transparent px-4 py-2.5 text-xs font-semibold text-status-danger-text hover:bg-status-danger-bg disabled:opacity-50"
                >
                  <XCircle size={16} aria-hidden="true" />
                  <span>Tolak / Batalkan</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="border-t border-border-default pt-4 text-xs text-text-muted">
            <p>Status saat ini bersifat final (Read-Only). Tidak ada mutasi status lebih lanjut yang diizinkan.</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {dialogAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="rounded-card border border-border-default bg-bg-surface p-6 max-w-md w-full shadow-modal space-y-4">
            <div className="flex items-center gap-2 font-bold text-base text-text-primary">
              <AlertTriangle size={20} className="text-action-secondary" aria-hidden="true" />
              <span>
                {dialogAction === 'approve' && `Setujui Booking ${booking.kode_booking}?`}
                {dialogAction === 'cancel' && `Batalkan Booking ${booking.kode_booking}?`}
                {dialogAction === 'check_in' && `Konfirmasi Check-In ${booking.kode_booking}?`}
                {dialogAction === 'check_out' && `Konfirmasi Check-Out ${booking.kode_booking}?`}
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              {dialogAction === 'approve' && 'Status akan berubah menjadi Disetujui. Member dapat mengakses e-ticket dan QR code untuk check-in.'}
              {dialogAction === 'cancel' && 'Status akan dibatalkan dan slot ruangan akan dilepaskan kembali ke jadwal publik.'}
              {dialogAction === 'check_in' && 'Status akan berubah menjadi Sedang Digunakan (Aktif). Jam kedatangan akan dicatat ke sistem.'}
              {dialogAction === 'check_out' && 'Status akan berubah menjadi Selesai. Penggunaan ruangan berakhir dan pendapatan bersih dihitung ke laporan.'}
            </p>

            {(statusMutation.isError || checkInMutation.isError || checkOutMutation.isError) ? (
              <InlineAlert title="Gagal memproses aksi" variant="danger">
                <p className="text-xs mt-1">
                  {statusMutation.error?.message || checkInMutation.error?.message || checkOutMutation.error?.message || 'Terjadi bentrok jadwal atau status telah berubah.'}
                </p>
              </InlineAlert>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDialogAction(null)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                Kembali
              </button>
              <Button
                type="button"
                pending={isPending}
                onClick={handleExecuteAction}
                className="min-w-28 text-xs"
              >
                {isPending ? 'Memproses...' : 'Ya, Lanjutkan'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
