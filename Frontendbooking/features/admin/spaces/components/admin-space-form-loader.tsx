'use client';

import { useAdminSpace } from '../hooks';
import { AdminSpaceForm } from './admin-space-form';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';

export function AdminSpaceFormLoaderClient({ spaceId }: { spaceId: number }) {
  const { data: space, isLoading, isError, error, refetch } = useAdminSpace(spaceId);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (isError || !space) {
    return (
      <div className="max-w-md">
        <InlineAlert title="Space Tidak Ditemukan" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Data space tidak dapat dimuat.'}
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

  return <AdminSpaceForm space={space} />;
}
