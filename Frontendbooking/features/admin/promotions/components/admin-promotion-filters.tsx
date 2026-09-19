'use client';

import { Search, X } from 'lucide-react';
import { formatPromotionStatus } from '../status';

type AdminPromotionFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
};

const statusOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua Status' },
  { value: 'active', label: formatPromotionStatus('active').label },
  { value: 'upcoming', label: formatPromotionStatus('upcoming').label },
  { value: 'expired', label: formatPromotionStatus('expired').label },
];

export function AdminPromotionFilters({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onReset,
}: AdminPromotionFiltersProps) {
  const hasActiveFilter = Boolean(search.trim()) || Boolean(selectedStatus);

  return (
    <section
      aria-label="Filter Promosi"
      className="rounded-card border border-border-default bg-bg-surface p-4 sm:p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kode promo..."
            aria-label="Cari kode promo"
            className="min-h-10 w-full rounded-control border border-border-default bg-bg-canvas pl-10 pr-4 text-xs text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          />
        </div>

        {/* Status Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                aria-pressed={isSelected}
                className={`min-h-9 rounded-badge px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] ${
                  isSelected
                    ? 'bg-action-primary text-text-on-brand shadow-sm'
                    : 'bg-bg-subtle text-text-secondary hover:bg-border-default'
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          {hasActiveFilter ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-9 items-center gap-1 rounded-badge border border-border-default bg-transparent px-2.5 py-1 text-xs font-semibold text-text-secondary hover:bg-bg-subtle"
            >
              <X size={13} aria-hidden="true" />
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
