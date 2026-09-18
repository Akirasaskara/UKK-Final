'use client';

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Tidak mencatat data sensitif atau token ke console
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto space-y-4">
        <h1 className="font-ui text-2xl font-bold tracking-tight text-text-primary">
          Terjadi Kesalahan Sistem
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Halaman tidak dapat dimuat dengan benar. Silakan coba muat ulang atau kembali lagi nanti.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 text-sm font-medium text-text-on-brand bg-action-primary hover:bg-action-primary-hover active:bg-action-primary-active rounded-xl transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </main>
  );
}
