'use client';

import { Search, X } from 'lucide-react';
import { formatSpaceType } from '@/lib/format/space';

type AdminSpaceFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedTipe: string;
  onTipeChange: (value: string) => void;
  onReset: () => void;
};

const spaceTypes = [
  { value: '', label: 'Semua Tipe' },
  { value: 'desk', label: formatSpaceType('desk') },
  { value: 'meeting_room', label: formatSpaceType('meeting_room') },
  { value: 'private_office', label: formatSpaceType('private_office') },
];

export function AdminSpaceFilters({
  search,
  onSearchChange,
  selectedTipe,
  onTipeChange,
  onReset,
}: AdminSpaceFiltersProps) {
  const hasActiveFilter = Boolean(search.trim()) || Boolean(selectedTipe);

  return (
    <section
      aria-label="Filter Inventaris Space"
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
            placeholder="Cari nama atau fasilitas space..."
            aria-label="Cari nama atau fasilitas space"
            className="min-h-10 w-full rounded-control border border-border-default bg-bg-canvas pl-10 pr-4 text-xs text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          />
        </div>

        {/* Tipe Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {spaceTypes.map((type) => {
            const isSelected = selectedTipe === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => onTipeChange(type.value)}
                aria-pressed={isSelected}
                className={`min-h-9 rounded-badge px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] ${
                  isSelected
                    ? 'bg-action-primary text-text-on-brand shadow-sm'
                    : 'bg-bg-subtle text-text-secondary hover:bg-border-default'
                }`}
              >
                {type.label}
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
