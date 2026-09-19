'use client';

import { AlertTriangle } from 'lucide-react';
import { InlineAlert } from '@/components/ui/inline-alert';
import type { AdminPromotionDetail, AdminPromotionSummary } from '../schemas';

type ArchivePromotionDialogProps = {
  promotion: AdminPromotionDetail | AdminPromotionSummary;
  isOpen: boolean;
  isPending: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ArchivePromotionDialog({
  promotion,
  isOpen,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: ArchivePromotionDialogProps) {
  if (!isOpen) return null;

  const isActive = promotion.status === 'active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="rounded-card border border-border-default bg-bg-surface p-6 max-w-md w-full shadow-modal space-y-4">
        <div className="flex items-center gap-2 text-status-danger-text font-bold text-base">
          <AlertTriangle size={20} aria-hidden="true" />
          <span>Arsipkan Promo {promotion.nama_diskon}?</span>
        </div>

        <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
          <p>
            Kode promo ini akan dinonaktifkan dari katalog publik dan tidak dapat digunakan lagi untuk reservasi booking baru.
          </p>
          {isActive ? (
            <p className="rounded bg-[var(--amber-50)] p-2.5 text-[var(--amber-800)] font-medium">
              Perhatian: Promo ini sedang berstatus <strong>Aktif</strong> dan akan langsung hilang dari pilihan pemesanan pelanggan.
            </p>
          ) : null}
          <p className="text-text-muted">
            Reservasi yang sudah menggunakan promo ini tetap menyimpan rincian potongan pada bukti transaksi secara aman.
          </p>
        </div>

        {errorMessage ? (
          <InlineAlert title="Gagal mengarsipkan promo" variant="danger">
            <p className="text-xs mt-1">{errorMessage}</p>
          </InlineAlert>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="inline-flex min-h-10 items-center justify-center rounded-control bg-status-danger-text px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Mengarsipkan...' : 'Ya, Arsipkan Promo'}
          </button>
        </div>
      </div>
    </div>
  );
}
