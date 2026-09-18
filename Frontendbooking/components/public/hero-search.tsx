'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { formatSpaceType } from '@/lib/format/space';

export function HeroSearch() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tipe, setTipe] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (tipe) params.set('tipe', tipe);

    const qs = params.toString();
    router.push(qs ? `/spaces?${qs}` : '/spaces');
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-card border border-border-default bg-bg-surface p-4 sm:p-6 shadow-raised space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
        <div className="sm:col-span-7">
          <label htmlFor="hero-search" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Nama Ruangan / Coworking
          </label>
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input
              id="hero-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Contoh: Dedicated Desk, Meeting Room A..."
              className="min-h-12 w-full rounded-control border border-border-default bg-bg-canvas pl-10 pr-3 text-sm text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
            />
          </div>
        </div>

        <div className="sm:col-span-5">
          <label htmlFor="hero-tipe" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Tipe Ruang
          </label>
          <select
            id="hero-tipe"
            value={tipe}
            onChange={(e) => setTipe(e.target.value)}
            className="min-h-12 w-full rounded-control border border-border-default bg-bg-canvas px-3 text-sm text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          >
            <option value="">Semua Tipe Ruang</option>
            <option value="desk">{formatSpaceType('desk')}</option>
            <option value="meeting_room">{formatSpaceType('meeting_room')}</option>
            <option value="private_office">{formatSpaceType('private_office')}</option>
          </select>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-control bg-action-primary px-6 py-2 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover active:bg-action-primary-active transition-colors shadow-sm"
        >
          Cari Space Sekarang
        </button>
      </div>
    </form>
  );
}
