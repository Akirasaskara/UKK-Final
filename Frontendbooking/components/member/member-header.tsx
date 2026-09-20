import Link from 'next/link';
import { LogoutButton } from '@/components/auth/logout-button';

export function MemberHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-default/80 bg-bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:min-h-18 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/member"
            className="group flex min-h-11 items-center rounded-lg p-1 text-text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
            aria-label="Dashboard Smart Space Booking"
          >
            <span className="font-semibold tracking-tight text-base sm:text-lg">
              Smart Space Booking
            </span>
          </Link>

          <nav aria-label="Navigasi Member" className="hidden sm:flex sm:items-center sm:gap-5">
            <Link href="/spaces" className="min-h-11 content-center text-sm font-semibold text-text-secondary transition-colors hover:text-action-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]">
              Cari Space
            </Link>
            <Link href="/member/bookings" className="min-h-11 content-center text-sm font-semibold text-text-secondary transition-colors hover:text-action-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]">
              Booking Saya
            </Link>
            <Link href="/member/history" className="min-h-11 content-center text-sm font-semibold text-text-secondary transition-colors hover:text-action-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]">
              Riwayat
            </Link>
            <Link href="/member/profile" className="min-h-11 content-center text-sm font-semibold text-text-secondary transition-colors hover:text-action-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]">
              Profil
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/member/profile"
            className="inline-flex min-h-11 items-center justify-center rounded-control border border-border-strong px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] sm:hidden"
          >
            Profil
          </Link>
          <div className="hidden sm:block">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
