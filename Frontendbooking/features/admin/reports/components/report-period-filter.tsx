'use client';

import { Calendar } from 'lucide-react';

type ReportPeriodFilterProps = {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
};

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const availableYears = [2024, 2025, 2026, 2027, 2028];

export function ReportPeriodFilter({
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
}: ReportPeriodFilterProps) {
  return (
    <section
      aria-label="Filter Periode Laporan"
      className="rounded-card border border-border-default bg-bg-surface p-4 sm:p-5 shadow-sm print:hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Calendar size={16} className="text-action-primary" aria-hidden="true" />
          <span>Pilih Periode Laporan Bulanan:</span>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="report-month" className="sr-only">Pilih Bulan</label>
          <select
            id="report-month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="min-h-10 rounded-control border border-border-default bg-bg-canvas px-3 text-xs text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] font-semibold"
          >
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>

          <label htmlFor="report-year" className="sr-only">Pilih Tahun</label>
          <select
            id="report-year"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="min-h-10 rounded-control border border-border-default bg-bg-canvas px-3 text-xs text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] font-semibold"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
