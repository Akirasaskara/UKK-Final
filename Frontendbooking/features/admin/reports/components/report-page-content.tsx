'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Printer, BarChart3 } from 'lucide-react';
import { useReportSummary } from '../hooks';
import type { ReportGranularity } from '../schemas';
import { ReportPeriodFilter } from './report-period-filter';
import { ReportKpiGrid } from './report-kpi-grid';
import { ReportCharts } from './report-charts';
import { ReportBreakdownTable } from './report-breakdown-table';
import { exportReportSummaryToCsv } from '../csv-export';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';

function getJakartaCurrentMonthBounds(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export function AdminReportPageContent({
  initialGranularity,
  initialFrom,
  initialTo,
}: {
  initialGranularity: ReportGranularity;
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentGranularity = (searchParams.get('granularity') as ReportGranularity) || initialGranularity;
  const currentFrom = searchParams.get('from') || initialFrom;
  const currentTo = searchParams.get('to') || initialTo;

  const validGranularity: ReportGranularity = ['day', 'week', 'month'].includes(currentGranularity)
    ? currentGranularity
    : 'month';

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const fallback = getJakartaCurrentMonthBounds();
  const validFrom = dateRegex.test(currentFrom) ? currentFrom : fallback.from;
  const validTo = dateRegex.test(currentTo) ? currentTo : fallback.to;

  const canonicalQuery = `granularity=${validGranularity}&from=${validFrom}&to=${validTo}`;

  useEffect(() => {
    const currentCanonical = `granularity=${searchParams.get('granularity') ?? ''}&from=${searchParams.get('from') ?? ''}&to=${searchParams.get('to') ?? ''}`;
    if (currentCanonical !== canonicalQuery) {
      router.replace(`/admin/reports?${canonicalQuery}`);
    }
  }, [canonicalQuery, router, searchParams]);

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useReportSummary({
    granularity: validGranularity,
    from: validFrom,
    to: validTo,
  });

  function handleFilterApply(params: { granularity: ReportGranularity; from: string; to: string }) {
    router.replace(`/admin/reports?granularity=${params.granularity}&from=${params.from}&to=${params.to}`);
  }

  function handleExportCsv() {
    if (report) {
      exportReportSummaryToCsv(report);
    }
  }

  function handlePrint() {
    window.print();
  }

  const granularityLabel =
    validGranularity === 'day' ? 'Harian' : validGranularity === 'week' ? 'Mingguan' : 'Bulanan';

  return (
    <div className="space-y-8 print:space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-action-secondary font-bold text-xs uppercase tracking-wider">
            <BarChart3 size={16} aria-hidden="true" />
            <span>Rekapitulasi Finansial & Operasional</span>
          </div>
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-1">
            Laporan Kinerja Coworking Space
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Periode: <strong>{validFrom} s/d {validTo}</strong> ({granularityLabel} · Zona Waktu Asia/Jakarta)
          </p>
        </div>

        {/* Action Buttons (Hidden saat Print) */}
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            type="button"
            disabled={isLoading || isError || !report}
            onClick={handleExportCsv}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-border-default bg-bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-bg-subtle transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={15} aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            disabled={isLoading || isError || !report}
            onClick={handlePrint}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-action-primary px-3.5 py-2 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover transition-colors shadow-sm disabled:opacity-50"
          >
            <Printer size={15} aria-hidden="true" />
            <span>Cetak A4</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Periode Multi-Granularity */}
      <ReportPeriodFilter
        granularity={validGranularity}
        from={validFrom}
        to={validTo}
        onApply={handleFilterApply}
      />

      {/* 3. Error State */}
      {isError ? (
        <InlineAlert title="Gagal memuat laporan finansial" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data laporan.'}
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

      {/* 4. Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-card" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-card" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-7 h-72 w-full rounded-card" />
            <Skeleton className="lg:col-span-5 h-72 w-full rounded-card" />
          </div>
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ) : null}

      {/* 5. Report Content (KPIs, Charts, Table) */}
      {!isLoading && !isError && report ? (
        <div className="space-y-8 print:space-y-6">
          {/* KPI Cards Grid */}
          <ReportKpiGrid totals={report.totals} />

          {/* Visual Charts (Time-Series + Category Breakdown) */}
          <ReportCharts
            series={report.series}
            typeBreakdown={report.rincian_per_tipe_space}
            granularity={validGranularity}
          />

          {/* Breakdown Data Tables (Time-Series WCAG Table + Type Breakdown Table) */}
          <ReportBreakdownTable
            typeItems={report.rincian_per_tipe_space}
            seriesItems={report.series}
            granularity={validGranularity}
          />

          <p className="text-[11px] text-text-muted text-center leading-relaxed print:text-left pt-2 border-t border-border-default/60">
            Catatan Finansial: Realisasi nilai layanan dihitung dari pemesanan yang telah berstatus <strong>Selesai</strong>. Estimasi bruto mencakup pemesanan disetujui, aktif, dan selesai pada periode bersangkutan.
          </p>
        </div>
      ) : null}
    </div>
  );
}
