import { LogoutButton } from '@/components/auth/logout-button';

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-8">
      <div className="w-full rounded-card border border-border-default bg-bg-surface p-6 shadow-card sm:p-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-action-secondary">
          Area Pengelola
        </p>
        <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Coworking Anda Siap Dikelola
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-text-secondary">
          Pengelolaan space, promosi, reservasi, dan laporan akan tersedia pada tahap implementasi berikutnya.
        </p>
        <div className="mt-8">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
