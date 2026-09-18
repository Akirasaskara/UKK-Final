'use client';

import { PublicContainer } from '@/components/public/public-container';
import { InlineAlert } from '@/components/ui/inline-alert';

export default function SpacesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PublicContainer className="py-16">
      <div className="max-w-lg mx-auto">
        <InlineAlert
          title="Tidak dapat memuat halaman katalog"
          variant="danger"
        >
          <p className="mt-1 text-sm">
            {error.message || 'Terjadi kesalahan sistem saat mengambil data katalog space.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => reset()}
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
