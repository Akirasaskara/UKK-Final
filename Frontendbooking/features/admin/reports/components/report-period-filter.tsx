'use client';

import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import type { ReportGranularity } from '../schemas';

type ReportPeriodFilterProps = {
  granularity: ReportGranularity;
  from: string;
  to: string;
  onApply: (params: { granularity: ReportGranularity; from: string; to: string }) => void;
};

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const availableYears = [2024, 2025, 2026, 2027, 2028];

export function ReportPeriodFilter({
  granularity,
  from,
  to,
  onApply,
}: ReportPeriodFilterProps) {
  const [activeTab, setActiveTab] = useState<ReportGranularity>(granularity);
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  // Extract initial month and year from `from`
  const [fromYearStr, fromMonthStr] = from.split('-');
  const [selectedMonth, setSelectedMonth] = useState(Number(fromMonthStr) || new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(Number(fromYearStr) || new Date().getFullYear());

  function handleTabChange(tab: ReportGranularity) {
    setActiveTab(tab);
    if (tab === 'month') {
      const startStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
      const endStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setFromDate(startStr);
      setToDate(endStr);
      onApply({ granularity: 'month', from: startStr, to: endStr });
    } else if (tab === 'day') {
      // Default to last 14 days up to today or current month window
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      const fourteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
      const fy = fourteenDaysAgo.getFullYear();
      const fm = String(fourteenDaysAgo.getMonth() + 1).padStart(2, '0');
      const fd = String(fourteenDaysAgo.getDate()).padStart(2, '0');
      const startStr = `${fy}-${fm}-${fd}`;

      setFromDate(startStr);
      setToDate(todayStr);
      onApply({ granularity: 'day', from: startStr, to: todayStr });
    } else if (tab === 'week') {
      // Default to last 8 weeks up to today
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      const eightWeeksAgo = new Date(Date.now() - 55 * 24 * 60 * 60 * 1000);
      const fy = eightWeeksAgo.getFullYear();
      const fm = String(eightWeeksAgo.getMonth() + 1).padStart(2, '0');
      const fd = String(eightWeeksAgo.getDate()).padStart(2, '0');
      const startStr = `${fy}-${fm}-${fd}`;

      setFromDate(startStr);
      setToDate(todayStr);
      onApply({ granularity: 'week', from: startStr, to: todayStr });
    }
  }

  function handleMonthYearSubmit(month: number, year: number) {
    setSelectedMonth(month);
    setSelectedYear(year);
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setFromDate(startStr);
    setToDate(endStr);
    onApply({ granularity: 'month', from: startStr, to: endStr });
  }

  function handleCustomRangeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromDate || !toDate) return;
    onApply({ granularity: activeTab, from: fromDate, to: toDate });
  }

  return (
    <section
      aria-label="Filter Periode Laporan"
      className="rounded-card border border-border-default bg-bg-surface p-4 sm:p-5 shadow-sm print:hidden space-y-4"
    >
      {/* Tab Switcher: Harian, Mingguan, Bulanan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Calendar size={16} className="text-action-primary" aria-hidden="true" />
          <span>Granularitas Laporan:</span>
        </div>

        <div className="inline-flex rounded-control border border-border-default bg-bg-canvas p-1">
          <button
            type="button"
            onClick={() => handleTabChange('day')}
            className={`min-h-8 rounded-control px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[var(--focus-ring)] ${
              activeTab === 'day'
                ? 'bg-action-primary text-text-on-brand shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Harian
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('week')}
            className={`min-h-8 rounded-control px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[var(--focus-ring)] ${
              activeTab === 'week'
                ? 'bg-action-primary text-text-on-brand shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Mingguan
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('month')}
            className={`min-h-8 rounded-control px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-[var(--focus-ring)] ${
              activeTab === 'month'
                ? 'bg-action-primary text-text-on-brand shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      {/* Filter Form Controls */}
      {activeTab === 'month' ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-text-muted">
            Pilih bulan dan tahun kalender:
          </p>

          <div className="flex items-center gap-3">
            <label htmlFor="report-month" className="sr-only">Pilih Bulan</label>
            <select
              id="report-month"
              value={selectedMonth}
              onChange={(e) => handleMonthYearSubmit(Number(e.target.value), selectedYear)}
              className="min-h-10 rounded-control border border-border-default bg-bg-canvas px-3 text-xs text-text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] font-semibold"
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
              onChange={(e) => handleMonthYearSubmit(selectedMonth, Number(e.target.value))}
              className="min-h-10 rounded-control border border-border-default bg-bg-canvas px-3 text-xs text-text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] font-semibold"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCustomRangeSubmit} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-text-muted">
            {activeTab === 'day'
              ? 'Tentukan rentang tanggal harian (maksimal 31 hari):'
              : 'Tentukan rentang tanggal mingguan (maksimal 93 hari):'}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="date-from" className="text-xs text-text-muted">Dari:</label>
              <input
                id="date-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="min-h-10 rounded-control border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] font-semibold font-mono"
                required
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="date-to" className="text-xs text-text-muted">Sampai:</label>
              <input
                id="date-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="min-h-10 rounded-control border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] font-semibold font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-action-primary px-3.5 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover transition-colors shadow-sm"
            >
              <Filter size={13} aria-hidden="true" />
              <span>Terapkan</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
