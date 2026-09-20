'use client';

import Link from 'next/link';
import { PublicContainer } from '@/components/public/public-container';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/features/auth/hooks';
import { useMyBookings } from '../hooks';
import { BookingCard } from './booking-card';

export function MemberDashboardContent() {
  const profileQuery = useProfile();
  const bookingsQuery = useMyBookings();
  const memberName = profileQuery.data?.member?.nama_member;
  const bookings = bookingsQuery.data ?? [];
  const openBookings = bookings.filter((booking) =>
    ['belum_dikonfirm', 'disetujui', 'aktif'].includes(booking.status),
  );

  return (
    <PublicContainer className="py-10 sm:py-14">
      <header className="grid gap-6 border-b border-border-default pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-action-secondary">Area member</p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-text-primary sm:text-4xl">
            {memberName ? `Selamat datang, ${memberName}` : 'Ringkasan pemesanan'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
            Lanjutkan pencarian ruang atau periksa reservasi yang masih berjalan.
          </p>
        </div>
        <Link
          href="/spaces"
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-5 text-sm font-semibold text-text-on-brand transition-colors hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
        >
          Cari space
        </Link>
      </header>

      {bookingsQuery.isLoading || profileQuery.isLoading ? (
        <div className="mt-8" role="status" aria-label="Memuat ringkasan member">
          <Skeleton className="h-24 w-full" />
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-64 w-full" />
            ))}
          </div>
        </div>
      ) : null}

      {bookingsQuery.isError ? (
        <div className="mt-8">
          <InlineAlert title="Ringkasan booking belum dapat dimuat" variant="danger">
            <button
              type="button"
              onClick={() => bookingsQuery.refetch()}
              className="mt-3 min-h-11 rounded-control bg-status-danger-text px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
            >
              Coba lagi
            </button>
          </InlineAlert>
        </div>
      ) : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
        <>
          <section aria-label="Ringkasan booking" className="mt-8 grid gap-px border border-border-default bg-border-default sm:grid-cols-2">
            <div className="bg-bg-surface p-5 sm:p-6">
              <p className="text-xs font-semibold text-text-muted">Booking masih berjalan</p>
              <p className="mt-2 font-display text-3xl tabular-nums text-text-primary">{openBookings.length}</p>
            </div>
            <div className="bg-bg-surface p-5 sm:p-6">
              <p className="text-xs font-semibold text-text-muted">Booking tercatat</p>
              <p className="mt-2 font-display text-3xl tabular-nums text-text-primary">{bookings.length}</p>
            </div>
          </section>

          <section aria-labelledby="latest-bookings-title" className="mt-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="latest-bookings-title" className="font-ui text-xl font-bold text-text-primary">
                  Booking terbaru
                </h2>
                <p className="mt-1 text-sm text-text-secondary">Tiga transaksi terakhir pada akun Anda.</p>
              </div>
              <Link href="/member/history" className="inline-flex min-h-11 items-center text-sm font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]">
                Buka riwayat
              </Link>
            </div>

            {bookings.length === 0 ? (
              <EmptyState
                className="mt-5"
                title="Belum ada booking"
                description="Cari space dan tentukan jadwal untuk membuat reservasi pertama Anda."
              />
            ) : (
              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {bookings.slice(0, 3).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </PublicContainer>
  );
}
