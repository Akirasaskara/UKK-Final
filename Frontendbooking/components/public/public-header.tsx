'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useProfile } from '@/features/auth/hooks';
import { LogoutButton } from '@/components/auth/logout-button';

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/spaces', label: 'Space & Ruang' },
  { href: '/promotions', label: 'Promosi' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: profile } = useProfile();

  return (
    <header className="sticky top-0 z-20 border-b border-border-default/80 bg-bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center rounded-lg p-1 text-text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
          aria-label="Smart Space Booking Beranda"
        >
          <span className="font-semibold tracking-tight text-base sm:text-lg">
            Smart Space Booking
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex md:items-center md:gap-8">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded px-1.5 py-1 ${
                  isActive
                    ? 'text-action-primary'
                    : 'text-text-secondary hover:text-action-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop auth actions */}
        <div className="hidden md:flex md:items-center md:gap-3">
          {profile?.role === 'member' ? (
            <>
              <Link
                href="/member/bookings"
                className="inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
              >
                Booking Saya
              </Link>
              <Link
                href="/member/profile"
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-border-default px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
              >
                Profil
              </Link>
              <LogoutButton />
            </>
          ) : profile?.role === 'admin_space' ? (
            <>
              <Link
                href="/admin"
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] transition-colors"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register/member"
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-sm font-semibold text-text-on-brand hover:bg-action-primary-hover active:bg-action-primary-active focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] transition-colors"
              >
                Daftar Member
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((curr) => !curr)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-text-primary hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] md:hidden"
        >
          {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile navigation panel */}
      {mobileMenuOpen ? (
        <div className="border-b border-border-default bg-bg-surface px-4 py-6 md:hidden shadow-raised">
          <nav aria-label="Navigasi Mobile" className="flex flex-col space-y-4">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`min-h-11 flex items-center text-base font-semibold px-2 rounded-control ${
                    isActive
                      ? 'bg-bg-subtle text-action-primary'
                      : 'text-text-primary hover:bg-bg-subtle'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-border-default flex flex-col space-y-2">
              {profile?.role === 'member' ? (
                <>
                  <Link
                    href="/member/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center justify-center rounded-control border border-border-default text-sm font-semibold text-text-primary hover:bg-bg-subtle"
                  >
                    Booking Saya
                  </Link>
                  <Link
                    href="/member/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center justify-center rounded-control border border-border-default text-sm font-semibold text-text-primary hover:bg-bg-subtle"
                  >
                    Profil
                  </Link>
                  <div className="flex min-h-11 items-center justify-center">
                    <LogoutButton />
                  </div>
                </>
              ) : profile?.role === 'admin_space' ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center justify-center rounded-control bg-action-primary text-sm font-semibold text-text-on-brand"
                  >
                    Dashboard Admin
                  </Link>
                  <div className="flex min-h-11 items-center justify-center">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center justify-center rounded-control border border-border-default text-sm font-semibold text-text-primary hover:bg-bg-subtle"
                  >
                    Masuk ke Akun
                  </Link>
                  <Link
                    href="/register/member"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center justify-center rounded-control bg-action-primary text-sm font-semibold text-text-on-brand"
                  >
                    Daftar sebagai Member
                  </Link>
                  <Link
                    href="/register/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center justify-center rounded-control bg-bg-subtle text-xs font-semibold text-text-secondary hover:text-action-primary"
                  >
                    Daftar sebagai Pengelola Coworking
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
