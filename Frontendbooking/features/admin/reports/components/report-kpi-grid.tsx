import { CalendarDays, Clock, Tag, CheckCircle2 } from 'lucide-react';
import type { ReportTotals } from '../schemas';
import { formatIdr } from '@/lib/format/currency';

type ReportKpiGridProps = {
  totals: ReportTotals;
};

export function ReportKpiGrid({ totals }: ReportKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Transaksi */}
      <article className="rounded-card border border-border-default bg-bg-surface p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Total Reservasi
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--teal-50)] text-action-primary">
            <CalendarDays size={18} aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="font-ui text-3xl font-bold tracking-tight text-text-primary tabular-nums">
            {totals.total_transaksi}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Transaksi berstatus aktif/selesai
          </p>
        </div>
      </article>

      {/* 2. Total Jam Terpakai */}
      <article className="rounded-card border border-border-default bg-bg-surface p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Durasi Penggunaan
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-subtle text-text-secondary">
            <Clock size={18} aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="font-ui text-3xl font-bold tracking-tight text-text-primary tabular-nums">
            {totals.total_jam_terpakai} <span className="text-sm font-normal text-text-muted">Jam</span>
          </p>
          <p className="text-xs text-text-muted mt-1">
            Akumulasi durasi sewa ruang
          </p>
        </div>
      </article>

      {/* 3. Estimasi Nilai Bruto & Diskon */}
      <article className="rounded-card border border-border-default bg-bg-surface p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Estimasi Nilai Bruto
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gold-50)] text-[var(--gold-700)]">
            <Tag size={18} aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="font-ui text-2xl font-bold tracking-tight text-text-primary tabular-nums">
            {formatIdr(totals.estimasi_pendapatan_kotor)}
          </p>
          <p className="text-xs text-status-success-text mt-1">
            Potongan Promo: {formatIdr(totals.total_potongan_diskon)}
          </p>
        </div>
      </article>

      {/* 4. Realisasi Nilai Selesai */}
      <article className="rounded-card border border-[var(--teal-700)]/40 bg-bg-surface p-5 shadow-card ring-1 ring-[var(--teal-700)]/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-action-secondary">
            Realisasi Nilai Selesai
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-success-bg text-status-success-text">
            <CheckCircle2 size={18} aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="font-ui text-2xl font-bold tracking-tight text-action-primary tabular-nums">
            {formatIdr(totals.realisasi_pendapatan_bersih)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Layanan berstatus selesai digunakan
          </p>
        </div>
      </article>
    </div>
  );
}
