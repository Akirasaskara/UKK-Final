import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:bg-action-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-text-on-brand focus:outline-none focus:ring-[3px] focus:ring-[var(--focus-ring)]"
      >
        Lewati ke konten utama
      </a>
      <PublicHeader />
      <div id="main-content" className="flex-1">
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
