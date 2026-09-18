import Link from 'next/link';
import { LogoutButton } from '@/components/auth/logout-button';

export function MemberHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-default/80 bg-bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center rounded-lg p-1 text-text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
            aria-label="Smart Space Booking Beranda"
          >
            <span className="font-semibold tracking-tight text-base sm:text-lg">
              Smart Space Booking
            </span>
          </Link>

          <nav aria-label="Navigasi Member" className="hidden sm:flex sm:items-center sm:gap-6">
            <Link
              href="/spaces"
              className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-action-primary transition-colors"
            >
              Cari Space
            </Link>
            <Link
              href="/member/bookings"
              className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-action-primary transition-colors"
            >
              Booking Saya
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
