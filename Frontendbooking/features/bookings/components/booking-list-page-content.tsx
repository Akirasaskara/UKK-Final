'use client';

import { useMyBookings } from '../hooks';
import { BookingCard } from './booking-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PublicContainer } from '@/components/public/public-container';
import Link from 'next/link';

export function BookingListPageContent() {
  const { data: bookings, isLoading, isError, error, refetch } = useMyBookings();

  return (
    <PublicContainer className="py-10 sm:py-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Daftar Booking Saya
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Riwayat dan jadwal reservasi ruang kerja aktif Anda.
          </p>
        </div>

        <Link
          href="/spaces"
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-xs sm:text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
        >
          Buat Booking Baru
        </Link>
      </div>

      {isError ? (
        <InlineAlert title="Gagal mengambil daftar booking" variant="danger">
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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-card border border-border-default bg-bg-surface p-5 space-y-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full mt-2" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && bookings ? (
        bookings.length === 0 ? (
          <EmptyState
            title="Belum ada riwayat booking"
            description="Anda belum memiliki reservasi ruang kerja. Cari dan pesan workstation pertama Anda sekarang."
            action={
              <Link
                href="/spaces"
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-5 py-2.5 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover"
              >
                Cari Ruang Kerja
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )
      ) : null}
    </PublicContainer>
  );
}
