'use client';

import Link from 'next/link';
import {
  Clock,
  LogIn,
  Building2,
  Users,
  ArrowRight,
  Plus,
  QrCode,
  CalendarDays,
  Building,
} from 'lucide-react';
import { useAdminDashboardSummary } from '../hooks';
import { DashboardKpiCard } from './dashboard-kpi-card';
import { formatReservationStatus } from '@/features/bookings/status';
import { formatDateIndonesia } from '@/lib/format/date';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';

export function AdminDashboardPageContent() {
  const { data: summary, isLoading, isError, error, refetch } = useAdminDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-card" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="max-w-lg space-y-4">
        <InlineAlert title="Gagal Memuat Ringkasan Dashboard" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data dashboard operasional.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control bg-action-primary px-4 py-1.5 text-xs font-semibold text-text-on-brand"
          >
            Coba Lagi
          </button>
        </InlineAlert>
      </div>
    );
  }

  const { metrics, pending_queue: pendingQueue, today_reservations: todayReservations } = summary;

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Dashboard Operasional
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Pantau status antrean persetujuan dan aktivitas kedatangan pelanggan hari ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/check-in"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-action-primary px-3.5 py-2 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
          >
            <QrCode size={15} aria-hidden="true" />
            <span>Check-In QR</span>
          </Link>
          <Link
            href="/admin/spaces/new"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-border-default bg-bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-bg-subtle"
          >
            <Plus size={15} aria-hidden="true" />
            <span>Tambah Space</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardKpiCard
          title="Menunggu Persetujuan"
          value={metrics.pending_reservations}
          description="Reservasi baru perlu konfirmasi"
          icon={Clock}
          variant={metrics.pending_reservations > 0 ? 'warning' : 'default'}
        />
        <DashboardKpiCard
          title="Sedang Digunakan"
          value={metrics.active_reservations}
          description="Ruangan sedang aktif di lokasi"
          icon={LogIn}
          variant="accent"
        />
        <DashboardKpiCard
          title="Inventaris Space"
          value={metrics.active_spaces}
          description="Total workstation & meeting room"
          icon={Building2}
        />
        <DashboardKpiCard
          title="Pelanggan Terdaftar"
          value={metrics.total_members}
          description="Member yang pernah berkunjung"
          icon={Users}
        />
      </div>

      {/* Operational Sections: Queue & Today Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Antrean Perlu Konfirmasi */}
        <section aria-labelledby="queue-heading" className="rounded-card border border-border-default bg-bg-surface p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border-default pb-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-action-secondary" aria-hidden="true" />
              <h2 id="queue-heading" className="font-ui text-base font-bold text-text-primary">
                Antrean Perlu Persetujuan ({pendingQueue.length})
              </h2>
            </div>
            <Link
              href="/admin/reservations?status=belum_dikonfirm"
              className="text-xs font-semibold text-action-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          {pendingQueue.length === 0 ? (
            <p className="py-8 text-center text-xs text-text-muted">
              Tidak ada reservasi yang menunggu konfirmasi saat ini.
            </p>
          ) : (
            <div className="divide-y divide-border-default">
              {pendingQueue.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-mono font-bold text-text-primary truncate">{item.kode_booking}</p>
                    <p className="font-semibold text-text-secondary truncate">{item.space_name} • {item.member_name}</p>
                    <p className="text-text-muted text-[11px]">
                      {formatDateIndonesia(item.tanggal_reservasi)} ({item.jam_mulai} – {item.jam_selesai})
                    </p>
                  </div>
                  <Link
                    href={`/admin/reservations/${item.id}`}
                    className="shrink-0 rounded-control bg-bg-subtle px-3 py-1.5 font-semibold text-action-primary hover:bg-border-default transition-colors"
                  >
                    Proses
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Jadwal Kedatangan Hari Ini */}
        <section aria-labelledby="today-heading" className="rounded-card border border-border-default bg-bg-surface p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border-default pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-action-primary" aria-hidden="true" />
              <h2 id="today-heading" className="font-ui text-base font-bold text-text-primary">
                Jadwal Reservasi Hari Ini ({todayReservations.length})
              </h2>
            </div>
            <Link
              href="/admin/reservations"
              className="text-xs font-semibold text-action-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Semua Reservasi</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          {todayReservations.length === 0 ? (
            <p className="py-8 text-center text-xs text-text-muted">
              Belum ada jadwal penggunaan ruangan untuk hari ini.
            </p>
          ) : (
            <div className="divide-y divide-border-default">
              {todayReservations.map((item) => {
                const statusInfo = formatReservationStatus(item.status);
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-text-primary">{item.kode_booking}</span>
                        <span className={`rounded-badge px-2 py-0.5 text-[10px] font-semibold ${statusInfo.badgeStyle}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="font-semibold text-text-secondary truncate">{item.space_name} • {item.member_name}</p>
                      <p className="text-text-muted text-[11px]">{item.jam_mulai} – {item.jam_selesai} WIB ({item.durasi_jam} jam)</p>
                    </div>
                    <Link
                      href={`/admin/reservations/${item.id}`}
                      className="shrink-0 rounded-control bg-bg-subtle px-3 py-1.5 font-semibold text-text-primary hover:bg-border-default transition-colors"
                    >
                      Detail
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Operational Shortcuts Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/reservations"
          className="flex items-center gap-3 p-4 rounded-card border border-border-default bg-bg-surface hover:border-border-strong shadow-card transition-all"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--teal-50)] text-action-primary">
            <CalendarDays size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="font-ui text-sm font-bold text-text-primary">Semua Reservasi</p>
            <p className="text-xs text-text-muted">Lihat seluruh riwayat & filter status</p>
          </div>
        </Link>

        <Link
          href="/admin/spaces"
          className="flex items-center gap-3 p-4 rounded-card border border-border-default bg-bg-surface hover:border-border-strong shadow-card transition-all"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gold-50)] text-[var(--gold-700)]">
            <Building2 size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="font-ui text-sm font-bold text-text-primary">Kelola Space</p>
            <p className="text-xs text-text-muted">Tambah & perbarui tarif ruangan</p>
          </div>
        </Link>

        <Link
          href="/admin/profile"
          className="flex items-center gap-3 p-4 rounded-card border border-border-default bg-bg-surface hover:border-border-strong shadow-card transition-all"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-subtle text-text-secondary">
            <Building size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="font-ui text-sm font-bold text-text-primary">Profil Coworking</p>
            <p className="text-xs text-text-muted">Kontak operasional & fasilitas</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
