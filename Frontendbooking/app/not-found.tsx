import Link from 'next/link';

export default function RootNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto space-y-4">
        <h1 className="font-ui text-2xl font-bold tracking-tight text-text-primary">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Tautan yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-4 py-2 text-sm font-medium text-text-on-brand bg-action-primary hover:bg-action-primary-hover active:bg-action-primary-active rounded-xl transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
