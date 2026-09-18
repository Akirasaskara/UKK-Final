'use client';

import { useActivePromotions } from '../hooks';
import { PromotionCard } from './promotion-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PublicContainer } from '@/components/public/public-container';
import Link from 'next/link';

export function PromotionListContent() {
  const { data: promotions, isLoading, isError, error, refetch } = useActivePromotions();

  return (
    <PublicContainer className="py-10 sm:py-16 space-y-8">
      <div className="space-y-2 max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl text-text-primary tracking-tight">
          Penawaran & Promosi Aktif
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-text-secondary">
          Dapatkan potongan harga sewa workstation dan ruang meeting dengan promo aktif berikut.
        </p>
      </div>

      {isError ? (
        <InlineAlert title="Gagal memuat promosi" variant="danger">
          <p className="text-xs sm:text-sm mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data promo aktif.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control bg-status-danger-text px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Coba Lagi
          </button>
        </InlineAlert>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-card border border-border-default bg-bg-surface p-6 space-y-4"
            >
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && promotions ? (
        promotions.length === 0 ? (
          <EmptyState
            title="Belum ada promo aktif saat ini"
            description="Promo diskon terbaru akan segera hadir. Anda tetap dapat menjelajahi seluruh katalog space dengan tarif standar."
            action={
              <Link
                href="/spaces"
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-5 py-2.5 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover"
              >
                Jelajahi Katalog Space
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <PromotionCard key={promo.id} promotion={promo} />
            ))}
          </div>
        )
      ) : null}
    </PublicContainer>
  );
}
