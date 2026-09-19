'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { useAdminSpace, useArchiveSpaceMutation } from '../hooks';
import { ArchiveSpaceDialog } from './archive-space-dialog';
import { WorkspaceImage } from '@/features/spaces/components/workspace-image';
import { formatIdr } from '@/lib/format/currency';
import { formatSpaceType } from '@/lib/format/space';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';

export function AdminSpaceDetailPageContent({ spaceId }: { spaceId: number }) {
  const router = useRouter();
  const { data: space, isLoading, isError, error, refetch } = useAdminSpace(spaceId);
  const archiveMutation = useArchiveSpaceMutation();

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <Skeleton className="aspect-[16/10] w-full rounded-card" />
          </div>
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !space) {
    return (
      <div className="max-w-md">
        <InlineAlert title="Space Tidak Ditemukan" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Data space tidak ditemukan atau telah diarsipkan.'}
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

  async function handleConfirmArchive() {
    try {
      await archiveMutation.mutateAsync(spaceId);
      setArchiveDialogOpen(false);
      router.push('/admin/spaces');
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Breadcrumb
          items={[
            { label: 'Inventaris Space', href: '/admin/spaces' },
            { label: space.nama_space },
          ]}
        />

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/spaces/${space.id}/edit`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
          >
            <Edit size={14} aria-hidden="true" />
            <span>Edit Space</span>
          </Link>

          <button
            type="button"
            onClick={() => setArchiveDialogOpen(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-status-danger-text/40 bg-transparent px-3.5 py-2 text-xs font-semibold text-status-danger-text hover:bg-status-danger-bg"
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Arsipkan</span>
          </button>
        </div>
      </div>

      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Photo Preview */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card border border-border-default bg-bg-subtle">
              <WorkspaceImage
                src={space.foto_url}
                alt={`Foto ${space.nama_space}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="rounded-badge bg-bg-surface/90 px-3 py-1 text-xs font-bold text-text-primary shadow-sm backdrop-blur-xs">
                  {formatSpaceType(space.tipe)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Space Facts */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-action-secondary">
                Data Master Ruangan
              </span>
              <h1 className="font-ui text-2xl sm:text-3xl font-bold text-text-primary mt-1">
                {space.nama_space}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-control border border-border-default bg-bg-subtle p-4 text-xs">
              <div>
                <p className="text-text-muted">Kapasitas Maksimal</p>
                <p className="font-bold text-text-primary text-sm mt-0.5">{space.kapasitas} Orang</p>
              </div>
              <div>
                <p className="text-text-muted">Tarif Sewa</p>
                <p className="font-bold text-action-primary text-sm tabular-nums mt-0.5">
                  {formatIdr(space.harga_per_jam)} <span className="text-[10px] font-normal text-text-muted">/ jam</span>
                </p>
              </div>
              <div>
                <p className="text-text-muted">Versi Data</p>
                <p className="font-semibold text-text-primary mt-0.5">v{space.version}</p>
              </div>
              <div>
                <p className="text-text-muted">Status</p>
                <span className="inline-block mt-0.5 rounded-badge bg-status-success-bg px-2.5 py-0.5 text-[11px] font-semibold text-status-success-text">
                  Aktif
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-text-muted">
                Fasilitas & Ketentuan
              </h2>
              <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-text-secondary">
                {space.deskripsi}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ArchiveSpaceDialog
        space={space}
        isOpen={archiveDialogOpen}
        isPending={archiveMutation.isPending}
        errorMessage={archiveMutation.error instanceof Error ? archiveMutation.error.message : null}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveDialogOpen(false)}
      />
    </div>
  );
}
