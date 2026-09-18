import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t border-border-default/80 bg-bg-surface text-text-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 sm:col-span-2">
            <span className="font-display text-xl font-bold text-text-primary">
              Smart Space Booking
            </span>
            <p className="max-w-md text-sm leading-relaxed text-text-muted">
              Sistem reservasi ruang kerja, workstation, dan meeting room coworking space yang aman, transparan, dan bebas double booking.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Layanan Publik
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/spaces" className="hover:text-action-primary transition-colors">
                  Katalog Space
                </Link>
              </li>
              <li>
                <Link href="/promotions" className="hover:text-action-primary transition-colors">
                  Daftar Promosi
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-action-primary transition-colors">
                  Masuk ke Akun
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Kemitraan & Pengelola
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register/member" className="hover:text-action-primary transition-colors">
                  Daftar Member Baru
                </Link>
              </li>
              <li>
                <Link href="/register/admin" className="hover:text-action-primary transition-colors">
                  Daftarkan Coworking Space
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border-default pt-6 text-center text-xs text-text-muted">
          <p>© 2026 Smart Space Booking. Seluruh hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
