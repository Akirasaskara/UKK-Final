'use client';

import { AlertTriangle } from 'lucide-react';
import { InlineAlert } from '@/components/ui/inline-alert';
import type { AdminSpaceDetail } from '../schemas';

type ArchiveSpaceDialogProps = {
  space: AdminSpaceDetail;
  isOpen: boolean;
  isPending: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ArchiveSpaceDialog({
  space,
  isOpen,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: ArchiveSpaceDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="rounded-card border border-border-default bg-bg-surface p-6 max-w-md w-full shadow-modal space-y-4">
        <div className="flex items-center gap-2 text-status-danger-text font-bold text-base">
          <AlertTriangle size={20} aria-hidden="true" />
          <span>Arsipkan Space {space.nama_space}?</span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Ruangan ini akan dinonaktifkan dari katalog publik dan tidak dapat dipesan lagi untuk booking baru. Riwayat dan reservasi yang sudah berjalan tetap tersimpan aman.
        </p>

        {errorMessage ? (
          <InlineAlert title="Gagal mengarsipkan space" variant="danger">
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
            {isPending ? 'Mengarsipkan...' : 'Ya, Arsipkan Space'}
          </button>
        </div>
      </div>
    </div>
  );
}
