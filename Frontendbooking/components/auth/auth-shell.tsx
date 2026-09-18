import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.8fr)]">
      <section className="hidden bg-bg-brand p-12 text-text-on-brand lg:flex lg:flex-col lg:justify-between">
        <Link
          href="/"
          className="w-fit font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-brand)]"
        >
          Smart Space Booking
        </Link>
        <div className="max-w-xl space-y-5">
          <p className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.08]">
            Reservasi ruang kerja dengan jadwal dan harga yang jelas.
          </p>
          <p className="max-w-lg text-base leading-relaxed text-[var(--teal-100)]">
            Temukan space, periksa ketersediaan, lalu kelola booking dalam satu alur.
          </p>
        </div>
        <p className="text-sm text-[var(--teal-200)]">
          Sistem Reservasi Coworking Space dan Workstation
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="w-full max-w-[30rem]">
          <Link
            href="/"
            className="mb-8 inline-block font-semibold text-action-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 lg:hidden"
          >
            Smart Space Booking
          </Link>
          <div className="rounded-card border border-border-default bg-bg-surface p-6 shadow-card sm:p-8">
            <header className="mb-8 space-y-2">
              <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {title}
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-text-secondary">
                {description}
              </p>
            </header>
            {children}
            <div className="mt-8 border-t border-border-default pt-6 text-sm text-text-secondary">
              {footer}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
