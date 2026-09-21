'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';
import { useAdminSpaces } from '../hooks';
import { AdminSpaceFilters } from './admin-space-filters';
import { formatIdr } from '@/lib/format/currency';
import { formatSpaceType } from '@/lib/format/space';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';
import { WorkspaceImage } from '@/features/spaces/components/workspace-image';

export function AdminSpaceListPageContent() {
  const [rawSearch, setRawSearch] = useState('');
  const [selectedTipe, setSelectedTipe] = useState('');

  const debouncedSearch = useDebouncedValue(rawSearch, 300);

  const {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminSpaces({
    search: debouncedSearch || undefined,
    tipe: selectedTipe || undefined,
  });

  const spaces = result?.items ?? [];
  const hasFilter = Boolean(rawSearch.trim()) || Boolean(selectedTipe);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Inventaris Space Ruang Kerja
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Kelola data workstation, meeting room, dan private office yang tersedia di coworking Anda.
          </p>
        </div>

        <Link
          href="/admin/spaces/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-action-primary px-4 py-2 text-xs sm:text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Tambah Space Baru</span>
        </Link>
      </div>

      {/* Filters */}
      <AdminSpaceFilters
        search={rawSearch}
        onSearchChange={setRawSearch}
        selectedTipe={selectedTipe}
        onTipeChange={setSelectedTipe}
        onReset={() => {
          setRawSearch('');
          setSelectedTipe('');
        }}
      />

      {/* Error state */}
      {isError ? (
        <InlineAlert title="Gagal memuat inventaris space" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data space.'}
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
            <div key={i} className="rounded-card border border-border-default bg-bg-surface p-4 space-y-3">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : null}

      {/* Result list */}
      {!isLoading && !isError && result ? (
        spaces.length === 0 ? (
          hasFilter ? (
            <EmptyState
              title="Tidak ada space yang cocok"
              description="Coba ubah kata kunci pencarian atau reset filter kategori tipe space Anda."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setRawSearch('');
                    setSelectedTipe('');
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand"
                >
                  Reset Filter
                </button>
              }
            />
          ) : (
            <EmptyState
              title="Belum ada inventaris space"
              description="Coworking space Anda belum memiliki ruangan terdaftar. Tambahkan workstation atau meeting room pertama Anda."
              action={
                <Link
                  href="/admin/spaces/new"
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control bg-action-primary px-5 py-2.5 text-sm font-semibold text-text-on-brand"
                >
                  <Plus size={16} aria-hidden="true" />
                  <span>Tambah Space Pertama</span>
                </Link>
              }
            />
          )
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-medium text-text-muted">
              Menampilkan {spaces.length} space aktif dari total {result.meta.total} ruangan
            </p>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto rounded-card border border-border-default bg-bg-surface shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <caption className="sr-only">Tabel Inventaris Space Coworking</caption>
                <thead>
                  <tr className="border-b border-border-default bg-bg-subtle text-text-muted">
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider w-20">Foto</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Nama Space</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Kategori</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Kapasitas</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Tarif Sewa</th>
                    <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {spaces.map((space) => (
                    <tr key={space.id} className="hover:bg-bg-subtle/50 transition-colors">
                      <td className="p-3.5">
                        <div className="h-12 w-16 overflow-hidden rounded-md bg-bg-subtle border border-border-default">
                          <WorkspaceImage
                            src={space.foto_url ?? null}
                            alt={space.nama_space}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-text-primary text-sm">
                        <Link
                          href={`/admin/spaces/${space.id}`}
                          className="hover:text-action-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
                        >
                          {space.nama_space}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-badge bg-bg-subtle px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
                          {formatSpaceType(space.tipe)}
                        </span>
                      </td>
                      <td className="p-3.5 text-text-secondary">
                        {space.kapasitas} Orang
                      </td>
                      <td className="p-3.5 font-bold text-text-primary tabular-nums">
                        {formatIdr(space.harga_per_jam)} <span className="text-[10px] font-normal text-text-muted">/ jam</span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/spaces/${space.id}/edit`}
                            className="text-xs font-semibold text-action-secondary hover:underline"
                          >
                            Edit
                          </Link>
                          <span className="text-text-muted">•</span>
                          <Link
                            href={`/admin/spaces/${space.id}`}
                            className="inline-flex items-center gap-1 rounded-control bg-bg-subtle px-2.5 py-1 text-xs font-semibold text-text-primary hover:bg-border-default"
                          >
                            <span>Detail</span>
                            <ArrowRight size={12} aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 768px) */}
            <div className="md:hidden space-y-4">
              {spaces.map((space) => (
                <article key={space.id} className="rounded-card border border-border-default bg-bg-surface p-4 shadow-card space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-bg-subtle border border-border-default">
                      <WorkspaceImage
                        src={space.foto_url ?? null}
                        alt={space.nama_space}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="rounded-badge bg-bg-subtle px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                        {formatSpaceType(space.tipe)}
                      </span>
                      <h3 className="font-ui text-sm font-bold text-text-primary truncate">
                        {space.nama_space}
                      </h3>
                      <p className="font-ui text-xs font-bold text-action-primary tabular-nums">
                        {formatIdr(space.harga_per_jam)} / jam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border-default pt-2 text-xs">
                    <span className="text-text-muted">Kapasitas: {space.kapasitas} orang</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/spaces/${space.id}/edit`}
                        className="font-semibold text-action-secondary hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/spaces/${space.id}`}
                        className="font-semibold text-action-primary hover:underline"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
