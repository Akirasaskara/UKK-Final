'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  QrCode,
  Building2,
  Tag,
  Users,
  BarChart3,
  Building,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useLogoutMutation } from '@/features/auth/hooks';
import type { AuthProfile } from '@/features/auth/schemas';

type AdminShellProps = {
  profile: AuthProfile;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  available: boolean;
};

const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, available: true },
  { href: '/admin/reservations', label: 'Reservasi', icon: CalendarDays, available: true },
  { href: '/admin/check-in', label: 'Check-In QR', icon: QrCode, available: true },
  { href: '/admin/spaces', label: 'Space Inventaris', icon: Building2, available: true },
  { href: '/admin/promotions', label: 'Promosi', icon: Tag, available: true },
  { href: '/admin/members', label: 'Daftar Member', icon: Users, available: true },
  { href: '/admin/reports', label: 'Laporan Finansial', icon: BarChart3, available: false },
  { href: '/admin/profile', label: 'Profil Coworking', icon: Building, available: true },
];

export function AdminShell({ profile, children }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const logoutMutation = useLogoutMutation();

  const coworkingName = profile.space_owner?.nama_coworking ?? 'Coworking Space';

  return (
    <div className="min-h-screen bg-bg-canvas text-text-primary flex flex-col lg:flex-row">
      {/* 1. Desktop Persistent Sidebar (>= 1024px) */}
      <aside
        aria-label="Admin Sidebar"
        className={`hidden lg:flex lg:flex-col justify-between border-r border-border-default bg-bg-surface transition-all duration-200 sticky top-0 h-screen z-20 ${
          collapsed ? 'w-20' : 'w-66'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="h-18 flex items-center justify-between px-4 border-b border-border-default/80">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 overflow-hidden text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded"
              aria-label="Smart Space Booking Admin"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-action-primary text-xs font-bold text-text-on-brand tracking-wider">
                SSB
              </span>
              {!collapsed ? (
                <div className="truncate text-left">
                  <p className="font-semibold text-sm leading-tight truncate">{coworkingName}</p>
                  <p className="text-[11px] text-action-secondary font-medium">Panel Pengelola</p>
                </div>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed((curr) => !curr)}
              aria-label={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-control hover:bg-bg-subtle text-text-muted hover:text-text-primary transition-colors"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Navigasi Pengelola" className="flex-1 p-3 space-y-1">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              if (!item.available) {
                return (
                  <div
                    key={item.href}
                    title={collapsed ? `${item.label} (Fase Berikutnya)` : undefined}
                    className={`flex items-center justify-between px-3 py-2 rounded-control text-xs font-medium text-text-muted opacity-60 cursor-not-allowed ${
                      collapsed ? 'justify-center' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={17} className="shrink-0" aria-hidden="true" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </div>
                    {!collapsed ? (
                      <span className="text-[10px] font-bold uppercase rounded bg-bg-subtle px-1.5 py-0.5">
                        Segera
                      </span>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                    isActive
                      ? 'bg-action-primary text-text-on-brand shadow-sm'
                      : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={18} className="shrink-0" aria-hidden="true" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-border-default/80">
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-xs font-semibold text-status-danger-text hover:bg-status-danger-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={16} className="shrink-0" aria-hidden="true" />
            {!collapsed ? <span>Keluar Sesi</span> : null}
          </button>
        </div>
      </aside>

      {/* 2. Mobile Topbar (< 1024px) */}
      <header className="lg:hidden sticky top-0 z-20 h-16 border-b border-border-default bg-bg-surface/95 backdrop-blur-md px-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-text-primary">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-action-primary text-xs font-bold text-text-on-brand">
            SSB
          </span>
          <span className="font-semibold text-sm truncate max-w-[200px]">{coworkingName}</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen((curr) => !curr)}
          aria-label={mobileDrawerOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          aria-expanded={mobileDrawerOpen}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control hover:bg-bg-subtle text-text-primary"
        >
          {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileDrawerOpen ? (
        <div className="lg:hidden border-b border-border-default bg-bg-surface p-4 shadow-raised space-y-3">
          <nav aria-label="Navigasi Mobile Admin" className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              if (!item.available) {
                return (
                  <div
                    key={item.href}
                    className="flex min-h-11 items-center justify-between px-3 py-2 rounded-control text-xs font-medium text-text-muted opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase rounded bg-bg-subtle px-1.5 py-0.5">
                      Segera
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex min-h-11 items-center gap-3 px-3 py-2 rounded-control text-sm font-semibold ${
                    isActive
                      ? 'bg-action-primary text-text-on-brand'
                      : 'text-text-primary hover:bg-bg-subtle'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-border-default">
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              className="w-full flex min-h-11 items-center justify-center gap-2 rounded-control bg-status-danger-bg text-status-danger-text text-xs font-semibold"
            >
              <LogOut size={16} aria-hidden="true" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* 3. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
