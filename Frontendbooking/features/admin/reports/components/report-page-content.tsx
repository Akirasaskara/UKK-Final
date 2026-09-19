'use client';

import { useState } from 'react';
import { Download, Printer, BarChart3 } from 'lucide-react';
import { useMonthlyReport } from '../hooks';
import { ReportPeriodFilter } from './report-period-filter';
import { ReportKpiGrid } from './report-kpi-grid';
import { ReportCharts } from './report-charts';
import { ReportBreakdownTable } from './report-breakdown-table';
import { exportMonthlyReportToCsv } from '../csv-export';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';

export function AdminReportPageContent({
  initialMonth,
  initialYear,
}: {
  initialMonth: number;
  initialYear: number;
}) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useMonthlyReport({
    month: selectedMonth,
    year: selectedYear,
  });

  function handleExportCsv() {
    if (report) {
      exportMonthlyReportToCsv(report);
    }
  }

  function handlePrint() {
    window.print();
  }

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentMonthLabel = monthNames[selectedMonth - 1] || `Bulan-${selectedMonth}`;

  return (
    <div className="space-y-8 print:space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-action-secondary font-bold text-xs uppercase tracking-wider">
            <BarChart3 size={16} aria-hidden="true" />
            <span>Rekapitulasi Finansial</span>
          </div>
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mt-1">
            Laporan Operasional & Pendapatan
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Periode: <strong>{currentMonthLabel} {selectedYear}</strong> (Zona Waktu Asia/Jakarta)
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

      {/* 2. Filter Periode */}
      <ReportPeriodFilter
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
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
          <ReportKpiGrid report={report} />

          {/* Visual Charts (Chart.js) */}
          <ReportCharts items={report.rincian_per_tipe_space} />

          {/* Breakdown Data Table */}
          <ReportBreakdownTable items={report.rincian_per_tipe_space} />

          <p className="text-[11px] text-text-muted text-center leading-relaxed print:text-left pt-2 border-t border-border-default/60">
            Catatan Finansial: Realisasi nilai layanan dihitung dari pemesanan yang telah berstatus <strong>Selesai</strong>. Estimasi bruto mencakup pemesanan disetujui, aktif, dan selesai pada periode bersangkutan.
          </p>
        </div>
      ) : null}
    </div>
  );
}
