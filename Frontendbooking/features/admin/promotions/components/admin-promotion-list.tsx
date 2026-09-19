'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Tag, Calendar, Edit } from 'lucide-react';
import { useAdminPromotions, useArchivePromotionMutation } from '../hooks';
import { AdminPromotionFilters } from './admin-promotion-filters';
import { ArchivePromotionDialog } from './archive-promotion-dialog';
import { formatPromotionStatus } from '../status';
import { formatDateRangeIndonesia } from '@/lib/format/date';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';
import type { AdminPromotionSummary } from '../schemas';

export function AdminPromotionListPageContent() {
  const [rawSearch, setRawSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const debouncedSearch = useDebouncedValue(rawSearch, 300);

  const {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminPromotions({
    search: debouncedSearch || undefined,
    status: selectedStatus || undefined,
  });

  const archiveMutation = useArchivePromotionMutation();
  const [selectedToArchive, setSelectedToArchive] = useState<AdminPromotionSummary | null>(null);

  const promotions = result?.items ?? [];
  const hasFilter = Boolean(rawSearch.trim()) || Boolean(selectedStatus);

  async function handleConfirmArchive() {
    if (!selectedToArchive) return;
    try {
      await archiveMutation.mutateAsync(selectedToArchive.id);
      setSelectedToArchive(null);
    } catch {
      // Error captured by mutation
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Kelola Promo & Diskon
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Atur kupon potongan harga sewa workstation dan meeting room untuk pelanggan.
          </p>
        </div>

        <Link
          href="/admin/promotions/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-action-primary px-4 py-2 text-xs sm:text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Tambah Promo Baru</span>
        </Link>
      </div>

      {/* Filters */}
      <AdminPromotionFilters
        search={rawSearch}
        onSearchChange={setRawSearch}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={() => {
          setRawSearch('');
          setSelectedStatus('');
        }}
      />

      {/* Error state */}
      {isError ? (
        <InlineAlert title="Gagal memuat daftar promosi" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data promo.'}
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
      {!isLoading && !isError && result ? (
        promotions.length === 0 ? (
          hasFilter ? (
            <EmptyState
              title="Tidak ada promo yang cocok"
              description="Coba ubah kata kunci pencarian atau reset filter status promosi Anda."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setRawSearch('');
                    setSelectedStatus('');
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand"
                >
                  Reset Filter
                </button>
              }
            />
          ) : (
            <EmptyState
              title="Belum ada promo diskon"
              description="Coworking space Anda belum memiliki promo aktif. Buat penawaran diskon pertama Anda untuk menarik lebih banyak member."
              action={
                <Link
                  href="/admin/promotions/new"
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control bg-action-primary px-5 py-2.5 text-sm font-semibold text-text-on-brand"
                >
                  <Plus size={16} aria-hidden="true" />
                  <span>Tambah Promo Pertama</span>
                </Link>
              }
            />
          )
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-medium text-text-muted">
              Menampilkan {promotions.length} promosi dari total {result.meta.total} promo terdaftar
            </p>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto rounded-card border border-border-default bg-bg-surface shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <caption className="sr-only">Tabel Kelola Promosi & Diskon</caption>
                <thead>
                  <tr className="border-b border-border-default bg-bg-subtle text-text-muted">
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Kode Promo</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Besaran Diskon</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Periode Berlaku</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Status</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {promotions.map((promo) => {
                    const statusInfo = formatPromotionStatus(promo.status);
                    return (
                      <tr key={promo.id} className="hover:bg-bg-subtle/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-text-primary text-sm">
                          {promo.nama_diskon}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-action-primary text-sm tabular-nums">
                            <Tag size={13} aria-hidden="true" />
                            {promo.persentase_diskon}%
                          </span>
                        </td>
                        <td className="p-3.5 text-text-secondary">
                          {formatDateRangeIndonesia(promo.tanggal_awal, promo.tanggal_akhir)}
                        </td>
                        <td className="p-3.5">
                          <span className={`rounded-badge px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusInfo.badgeStyle}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-3">
                            <Link
                              href={`/admin/promotions/${promo.id}/edit`}
                              className="text-xs font-semibold text-action-secondary hover:underline"
                            >
                              Edit
                            </Link>
                            <span className="text-text-muted">•</span>
                            <button
                              type="button"
                              onClick={() => setSelectedToArchive(promo)}
                              className="text-xs font-semibold text-status-danger-text hover:underline"
                            >
                              Arsipkan
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 768px) */}
            <div className="md:hidden space-y-4">
              {promotions.map((promo) => {
                const statusInfo = formatPromotionStatus(promo.status);
                return (
                  <article key={promo.id} className="rounded-card border border-border-default bg-bg-surface p-4 shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-text-primary">
                        {promo.nama_diskon}
                      </span>
                      <span className={`rounded-badge px-2.5 py-0.5 text-[10px] font-semibold ${statusInfo.badgeStyle}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-action-primary font-bold">
                      <Tag size={14} aria-hidden="true" />
                      <span>Diskon {promo.persentase_diskon}%</span>
                    </div>

                    <div className="text-xs text-text-muted space-y-1 border-t border-border-default pt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} aria-hidden="true" />
                        <span>{formatDateRangeIndonesia(promo.tanggal_awal, promo.tanggal_akhir)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-default pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedToArchive(promo)}
                        className="font-semibold text-status-danger-text hover:underline"
                      >
                        Arsipkan
                      </button>
                      <Link
                        href={`/admin/promotions/${promo.id}/edit`}
                        className="font-semibold text-action-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Edit size={13} aria-hidden="true" />
                        <span>Edit Promo</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )
      ) : null}

      {/* Confirmation Dialog */}
      {selectedToArchive ? (
        <ArchivePromotionDialog
          promotion={selectedToArchive}
          isOpen={Boolean(selectedToArchive)}
          isPending={archiveMutation.isPending}
          errorMessage={archiveMutation.error instanceof Error ? archiveMutation.error.message : null}
          onConfirm={handleConfirmArchive}
          onCancel={() => setSelectedToArchive(null)}
        />
      ) : null}
    </div>
  );
}
