'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, QrCode } from 'lucide-react';
import { useAdminReservations } from '../hooks';
import { ReservationFiltersBar } from './reservation-filters';
import { formatReservationStatus } from '@/features/bookings/status';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import { formatSpaceType } from '@/lib/format/space';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';

export function AdminReservationListPageContent() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState('');

  const {
    data: reservations,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminReservations({
    status: selectedStatus || undefined,
    tanggal: selectedTanggal || undefined,
  });

  const hasFilter = Boolean(selectedStatus) || Boolean(selectedTanggal);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Operasional Reservasi
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Kelola antrean persetujuan, check-in, dan check-out kunjungan pelanggan.
          </p>
        </div>

        <Link
          href="/admin/check-in"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-action-primary px-4 py-2 text-xs sm:text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
        >
          <QrCode size={16} aria-hidden="true" />
          <span>Verifikasi Check-In</span>
        </Link>
      </div>

      {/* Filter Component */}
      <ReservationFiltersBar
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedTanggal={selectedTanggal}
        onTanggalChange={setSelectedTanggal}
        onReset={() => {
          setSelectedStatus('');
          setSelectedTanggal('');
        }}
      />

      {/* Error state */}
      {isError ? (
        <InlineAlert title="Gagal memuat daftar reservasi" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat menghubungi server.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control bg-status-danger-text px-4 py-1.5 text-xs font-semibold text-white"
          >
            Coba Lagi
          </button>
        </InlineAlert>
      ) : null}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card border border-border-default bg-bg-surface p-5 space-y-3">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : null}

      {/* Results Table & Cards */}
      {!isLoading && !isError && reservations ? (
        reservations.length === 0 ? (
          hasFilter ? (
            <EmptyState
              title="Tidak ada reservasi yang cocok"
              description="Coba ubah filter status atau tanggal reservasi yang Anda pilih."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('');
                    setSelectedTanggal('');
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand"
                >
                  Reset Filter
                </button>
              }
            />
          ) : (
            <EmptyState
              title="Belum ada reservasi masuk"
              description="Saat ini belum ada member yang melakukan pemesanan pada coworking space Anda."
            />
          )
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-medium text-text-muted">
              Menampilkan {reservations.length} data reservasi
            </p>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto rounded-card border border-border-default bg-bg-surface shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <caption className="sr-only">Tabel Antrean Reservasi Ruang Kerja</caption>
                <thead>
                  <tr className="border-b border-border-default bg-bg-subtle text-text-muted">
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Kode Booking</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Member</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Ruangan</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Jadwal Penggunaan</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Total Bayar</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Status</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {reservations.map((item) => {
                    const statusInfo = formatReservationStatus(item.status);
                    return (
                      <tr key={item.id} className="hover:bg-bg-subtle/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-text-primary">
                          {item.kode_booking}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-text-primary">{item.member?.nama_member ?? 'Member'}</p>
                          <p className="text-text-muted text-[11px]">{item.member?.telp}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-text-primary">{item.space?.nama_space ?? 'Space'}</p>
                          {item.space ? (
                            <p className="text-action-secondary text-[11px]">{formatSpaceType(item.space.tipe)}</p>
                          ) : null}
                        </td>
                        <td className="p-3.5 text-text-secondary">
                          <p className="font-medium">{formatDateIndonesia(item.tanggal_reservasi)}</p>
                          <p className="text-[11px] text-text-muted">{item.jam_mulai} – {item.jam_selesai} WIB ({item.durasi_jam} jam)</p>
                        </td>
                        <td className="p-3.5 font-bold text-text-primary tabular-nums">
                          {formatIdr(item.total_bayar)}
                        </td>
                        <td className="p-3.5">
                          <span className={`rounded-badge px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusInfo.badgeStyle}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/admin/reservations/${item.id}`}
                            className="inline-flex items-center gap-1 rounded-control bg-bg-subtle px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-border-default transition-colors"
                          >
                            <span>Proses</span>
                            <ArrowRight size={13} aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 768px) */}
            <div className="md:hidden space-y-4">
              {reservations.map((item) => {
                const statusInfo = formatReservationStatus(item.status);
                return (
                  <article key={item.id} className="rounded-card border border-border-default bg-bg-surface p-4 shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-text-primary">
                        {item.kode_booking}
                      </span>
                      <span className={`rounded-badge px-2.5 py-0.5 text-[10px] font-semibold ${statusInfo.badgeStyle}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-ui text-base font-bold text-text-primary">
                        {item.space?.nama_space ?? 'Ruang Kerja'}
                      </h3>
                      <p className="text-xs text-text-muted">
                        Pemesan: <strong>{item.member?.nama_member}</strong> ({item.member?.telp})
                      </p>
                    </div>

                    <div className="text-xs text-text-secondary space-y-1 border-t border-border-default pt-2">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Jadwal:</span>
                        <span>{formatDateIndonesia(item.tanggal_reservasi)} ({item.jam_mulai} – {item.jam_selesai})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Total:</span>
                        <span className="font-bold tabular-nums text-text-primary">{formatIdr(item.total_bayar)}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        href={`/admin/reservations/${item.id}`}
                        className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-control bg-action-primary text-xs font-semibold text-text-on-brand"
                      >
                        <span>Buka Detail & Operasi</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
