'use client';

import { Users, Building2, Clock } from 'lucide-react';
import { usePublicSpace } from '../hooks';
import { WorkspaceImage } from './workspace-image';
import { AvailabilityPanel } from './availability-panel';
import { formatIdr } from '@/lib/format/currency';
import { formatSpaceType } from '@/lib/format/space';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PublicContainer } from '@/components/public/public-container';

export function SpaceDetailPageContent({ spaceId }: { spaceId: number }) {
  const { data: space, isLoading, isError, error, refetch } = usePublicSpace(spaceId);

  if (isLoading) {
    return (
      <PublicContainer className="py-10 sm:py-16 space-y-8">
        <Skeleton className="h-6 w-1/3" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="aspect-[16/10] w-full rounded-card" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 w-full rounded-card" />
          </div>
        </div>
      </PublicContainer>
    );
  }

  if (isError || !space) {
    return (
      <PublicContainer className="py-16">
        <div className="max-w-md mx-auto">
          <InlineAlert title="Space tidak ditemukan" variant="danger">
            <p className="mt-1 text-sm">
              {error instanceof Error ? error.message : 'Ruang kerja tidak ditemukan atau telah diarsipkan.'}
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover"
              >
                Coba Lagi
              </button>
            </div>
          </InlineAlert>
        </div>
      </PublicContainer>
    );
  }

  return (
    <PublicContainer className="py-8 sm:py-12 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Beranda', href: '/' },
          { label: 'Katalog Space', href: '/spaces' },
          { label: space.nama_space },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Media & Workspace Facts */}
        <div className="lg:col-span-7 space-y-8">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card border border-border-default bg-bg-subtle shadow-card">
            <WorkspaceImage
              src={space.foto_url}
              alt={`Foto utama ${space.nama_space}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="rounded-badge bg-bg-surface/95 px-3.5 py-1.5 text-xs font-bold text-text-primary shadow-sm backdrop-blur-sm">
                {formatSpaceType(space.tipe)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {space.owner ? (
              <p className="text-xs sm:text-sm font-semibold text-action-secondary flex items-center gap-1.5">
                <Building2 size={16} aria-hidden="true" />
                <span>{space.owner.nama_coworking}</span>
              </p>
            ) : null}

            <h1 className="font-display text-3xl sm:text-4xl text-text-primary">
              {space.nama_space}
            </h1>

            <div className="flex flex-wrap items-center gap-6 border-y border-border-default py-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Users size={18} className="text-text-muted" aria-hidden="true" />
                <span>Kapasitas: <strong>{space.kapasitas} Orang</strong></span>
              </div>
              <div className="text-sm text-text-secondary">
                <span>Tarif: </span>
                <strong className="text-base text-action-primary font-bold tabular-nums">
                  {formatIdr(space.harga_per_jam)}
                </strong>
                <span className="text-xs text-text-muted"> / jam</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-ui text-lg font-bold text-text-primary">
                Deskripsi & Ketentuan Ruang
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {space.deskripsi}
              </p>
            </div>

            {/* Jam Operasional Factual Fallback */}
            <div className="rounded-control border border-border-default bg-bg-surface p-4 space-y-1.5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Clock size={14} aria-hidden="true" />
                Jam Operasional
              </p>
              <p className="text-xs text-text-secondary">
                Jam operasional belum tersedia secara spesifik. Silakan gunakan fitur cek ketersediaan untuk memeriksa slot aktif.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Availability Panel */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <AvailabilityPanel
              spaceId={space.id}
            />
          </div>
        </div>
      </div>
    </PublicContainer>
  );
}
