'use client';

import { Search, X } from 'lucide-react';

type AdminMemberFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
};

export function AdminMemberFilters({
  search,
  onSearchChange,
  onReset,
}: AdminMemberFiltersProps) {
  const hasFilter = Boolean(search.trim());

  return (
    <section
      aria-label="Pencarian Member"
      className="rounded-card border border-border-default bg-bg-surface p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama, instansi, atau telepon member..."
            aria-label="Cari nama, instansi, atau telepon member"
            className="min-h-10 w-full rounded-control border border-border-default bg-bg-canvas pl-10 pr-4 text-xs text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          />
        </div>

        {hasFilter ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-text-secondary hover:text-action-primary hover:underline underline-offset-4"
          >
            <X size={13} aria-hidden="true" />
            <span>Reset Pencarian</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
