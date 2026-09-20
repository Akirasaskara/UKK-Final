'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicContainer } from '@/components/public/public-container';
import { formatIdr } from '@/lib/format/currency';
import { useMyHistory } from '../hooks';
import { HistoryBookingRow } from './history-booking-row';
import { HistoryPeriodFilter } from './history-period-filter';

const PAGE_SIZE = 10;

function currentJakartaPeriod(): { month: number; year: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  return {
    month: Number(parts.find((part) => part.type === 'month')?.value),
    year: Number(parts.find((part) => part.type === 'year')?.value),
  };
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function MemberHistoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallback = currentJakartaPeriod();
  const rawMonth = positiveInteger(searchParams.get('month'), fallback.month);
  const rawYear = positiveInteger(searchParams.get('year'), fallback.year);
  const month = rawMonth >= 1 && rawMonth <= 12 ? rawMonth : fallback.month;
  const year = rawYear >= 2000 && rawYear <= 2100 ? rawYear : fallback.year;
  const page = positiveInteger(searchParams.get('page'), 1);

  const historyQuery = useMyHistory({ month, year, page, limit: PAGE_SIZE });
  const history = historyQuery.data;
  const totalPages = history ? Math.max(1, Math.ceil(history.total_reservasi / history.limit)) : 1;
  const canonicalQuery = `month=${month}&year=${year}&page=${page}`;

  useEffect(() => {
    const currentQuery = new URLSearchParams(searchParams.toString());
    const currentCanonical = `month=${currentQuery.get('month') ?? ''}&year=${currentQuery.get('year') ?? ''}&page=${currentQuery.get('page') ?? ''}`;
    if (currentCanonical !== canonicalQuery) {
      router.replace(`/member/history?${canonicalQuery}`);
    }
  }, [canonicalQuery, router, searchParams]);

  function updatePeriod(nextMonth: number, nextYear: number) {
    router.replace(`/member/history?month=${nextMonth}&year=${nextYear}&page=1`);
  }

  function updatePage(nextPage: number) {
    router.replace(`/member/history?month=${month}&year=${year}&page=${nextPage}`);
  }

  return (
    <PublicContainer className="py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-action-secondary">Catatan transaksi Anda</p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-text-primary sm:text-4xl">
          Riwayat pemesanan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
          Tinjau reservasi per bulan dan buka kembali detail transaksi yang Anda perlukan.
        </p>
      </header>

      <div className="mt-8">
        <HistoryPeriodFilter month={month} year={year} onPeriodChange={updatePeriod} />
      </div>

      {historyQuery.isError ? (
        <div className="mt-8">
          <InlineAlert title="Riwayat belum dapat dimuat" variant="danger">
            <p>{historyQuery.error instanceof Error ? historyQuery.error.message : 'Server tidak dapat dihubungi.'}</p>
            <button
              type="button"
              onClick={() => historyQuery.refetch()}
              className="mt-3 min-h-11 rounded-control bg-status-danger-text px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
            >
              Coba lagi
            </button>
          </InlineAlert>
        </div>
      ) : null}

      {historyQuery.isLoading ? (
        <div className="mt-8" aria-label="Memuat riwayat pemesanan" role="status">
          <div className="grid gap-px border border-border-default bg-border-default sm:grid-cols-2">
            <div className="bg-bg-surface p-5"><Skeleton className="h-16 w-full" /></div>
            <div className="bg-bg-surface p-5"><Skeleton className="h-16 w-full" /></div>
          </div>
          <div className="mt-7 rounded-card border border-border-default bg-bg-surface px-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-b border-border-default py-5 last:border-b-0">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-3 h-6 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!historyQuery.isLoading && !historyQuery.isError && history ? (
        <div className="mt-8">
          <section aria-label="Ringkasan periode" className="grid gap-px border border-border-default bg-border-default sm:grid-cols-2">
            <div className="bg-bg-surface p-5 sm:p-6">
              <p className="text-xs font-semibold text-text-muted">Reservasi pada periode ini</p>
              <p className="mt-2 font-display text-3xl tabular-nums text-text-primary">{history.total_reservasi}</p>
            </div>
            <div className="bg-bg-surface p-5 sm:p-6">
              <p className="text-xs font-semibold text-text-muted">Total pengeluaran</p>
              <p className="mt-2 font-display text-3xl tabular-nums text-text-primary">
                {formatIdr(history.total_pengeluaran)}
              </p>
            </div>
          </section>

          {history.items.length === 0 ? (
            <EmptyState
              className="mt-7"
              title="Tidak ada transaksi pada periode ini"
              description="Pilih bulan lain untuk melihat riwayat pemesanan Anda."
            />
          ) : (
            <section aria-labelledby="history-list-title" className="mt-7 rounded-card border border-border-default bg-bg-surface px-5 sm:px-6">
              <h2 id="history-list-title" className="sr-only">Daftar riwayat pemesanan</h2>
              {history.items.map((booking) => (
                <HistoryBookingRow key={booking.id} booking={booking} />
              ))}
            </section>
          )}

          {history.total_reservasi > history.limit ? (
            <nav aria-label="Paginasi riwayat" className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => updatePage(page - 1)}
                disabled={page <= 1}
                className="min-h-11 rounded-control border border-border-strong px-4 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
              >
                Sebelumnya
              </button>
              <p className="text-sm tabular-nums text-text-secondary">
                Halaman {Math.min(page, totalPages)} dari {totalPages}
              </p>
              <button
                type="button"
                onClick={() => updatePage(page + 1)}
                disabled={page >= totalPages}
                className="min-h-11 rounded-control border border-border-strong px-4 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
              >
                Berikutnya
              </button>
            </nav>
          ) : null}
        </div>
      ) : null}
    </PublicContainer>
  );
}
