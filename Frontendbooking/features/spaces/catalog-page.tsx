'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { usePublicSpaces } from './hooks';
import { CatalogFilters } from './components/catalog-filters';
import { WorkspaceCard } from './components/workspace-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PublicContainer } from '@/components/public/public-container';
import type { PublicSpace } from './schemas';

export function CatalogPageContent({
  initialTipe = '',
}: {
  initialTipe?: string;
}) {
  const [rawSearch, setRawSearch] = useState('');
  const [selectedTipe, setSelectedTipe] = useState(initialTipe);

  const debouncedSearch = useDebouncedValue(rawSearch, 300);

  const {
    data: spaces,
    isLoading,
    isError,
    error,
    refetch,
  } = usePublicSpaces({
    search: debouncedSearch,
    tipe: selectedTipe || undefined,
  });

  const hasFilter = Boolean(rawSearch.trim()) || Boolean(selectedTipe);

  return (
    <PublicContainer className="py-10 sm:py-16 space-y-8">
      {/* Header section */}
      <div className="space-y-2 max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl text-text-primary tracking-tight">
          Katalog Ruang Kerja & Meeting Room
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-text-secondary">
          Pilih workspace yang sesuai dengan kebutuhan kerja individu atau tim Anda.
        </p>
      </div>

      {/* Filter component */}
      <CatalogFilters
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
        <InlineAlert
          title="Gagal memuat katalog space."
          variant="danger"
        >
          <p className="text-xs sm:text-sm mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat menghubungi server.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control bg-status-danger-text px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Coba Muat Ulang
          </button>
        </InlineAlert>
      ) : null}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-card border border-border-default bg-bg-surface p-4 space-y-4"
            >
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Results grid */}
      {!isLoading && !isError && spaces ? (
        spaces.length === 0 ? (
          hasFilter ? (
            <EmptyState
              title="Tidak ada space yang cocok"
              description="Coba ubah kata kunci pencarian atau reset filter tipe space Anda."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setRawSearch('');
                    setSelectedTipe('');
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover"
                >
                  Reset Filter
                </button>
              }
            />
          ) : (
            <EmptyState
              title="Belum ada space yang terdaftar"
              description="Katalog saat ini belum memiliki data inventaris space aktif."
            />
          )
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-medium text-text-muted">
              Menampilkan {spaces.length} space ruang kerja aktif
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space: PublicSpace) => (
                <WorkspaceCard key={space.id} space={space} />
              ))}
            </div>
          </div>
        )
      ) : null}
    </PublicContainer>
  );
}
