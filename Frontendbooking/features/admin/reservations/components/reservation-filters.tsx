'use client';

import { formatReservationStatus } from '@/features/bookings/status';

type ReservationStatusFilterProps = {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedTanggal: string;
  onTanggalChange: (tanggal: string) => void;
  onReset: () => void;
};

const statusOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua Status' },
  { value: 'belum_dikonfirm', label: formatReservationStatus('belum_dikonfirm').label },
  { value: 'disetujui', label: formatReservationStatus('disetujui').label },
  { value: 'aktif', label: formatReservationStatus('aktif').label },
  { value: 'selesai', label: formatReservationStatus('selesai').label },
  { value: 'dibatalkan', label: formatReservationStatus('dibatalkan').label },
];

export function ReservationFiltersBar({
  selectedStatus,
  onStatusChange,
  selectedTanggal,
  onTanggalChange,
  onReset,
}: ReservationStatusFilterProps) {
  const hasActiveFilter = Boolean(selectedStatus) || Boolean(selectedTanggal);

  return (
    <section aria-label="Filter Antrean Reservasi" className="rounded-card border border-border-default bg-bg-surface p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                aria-pressed={isSelected}
                className={`min-h-10 rounded-badge px-3.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] ${
                  isSelected
                    ? 'bg-action-primary text-text-on-brand shadow-sm'
                    : 'bg-bg-subtle text-text-secondary hover:bg-border-default'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter & Reset */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedTanggal}
            onChange={(e) => onTanggalChange(e.target.value)}
            aria-label="Filter tanggal reservasi"
            className="min-h-10 rounded-control border border-border-default bg-bg-canvas px-3 text-xs text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          />

          {hasActiveFilter ? (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-text-secondary hover:text-action-primary hover:underline underline-offset-4"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
