'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useUploadSpacePhotoMutation } from '../hooks';
import { InlineAlert } from '@/components/ui/inline-alert';

type SpaceImageUploadProps = {
  currentPhotoUrl?: string | null;
  currentFilename?: string | null;
  onPhotoUploaded: (filename: string | null) => void;
};

export function SpaceImageUpload({
  currentPhotoUrl,
  currentFilename,
  onPhotoUploaded,
}: SpaceImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadSpacePhotoMutation();

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [stagedFilename, setStagedFilename] = useState<string | null>(currentFilename || null);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      setValidationError('Hanya file gambar berekstensi .jpg, .jpeg, .png, atau .webp yang diperbolehkan.');
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError('Ukuran foto maksimal 5MB.');
      return;
    }

    // Buat temporary local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const res = await uploadMutation.mutateAsync(file);
      setStagedFilename(res.filename);
      onPhotoUploaded(res.filename);
    } catch {
      // Error handled by mutation
    }
  }

  function handleRemovePhoto() {
    setPreviewUrl(null);
    setStagedFilename(null);
    onPhotoUploaded(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="space-image-input" className="text-sm font-semibold text-text-primary">
          Foto Ruangan / Fasilitas
        </label>
        <span className="text-xs text-text-muted">Opsional</span>
      </div>

      {validationError ? (
        <InlineAlert title="Berkas Tidak Valid" variant="danger">
          <p className="text-xs mt-1">{validationError}</p>
        </InlineAlert>
      ) : null}

      {uploadMutation.isError ? (
        <InlineAlert title="Unggah Foto Gagal" variant="danger">
          <p className="text-xs mt-1">
            {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Terjadi kendala saat mengunggah foto.'}
          </p>
        </InlineAlert>
      ) : null}

      {previewUrl ? (
        <div className="relative aspect-[16/10] w-full max-w-md overflow-hidden rounded-card border border-border-default bg-bg-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Pratinjau foto space"
            className="h-full w-full object-cover"
          />

          {uploadMutation.isPending ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs text-white text-xs font-semibold gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Mengunggah foto...</span>
            </div>
          ) : (
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={handleRemovePhoto}
                aria-label="Hapus foto terpilih"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-sm"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {stagedFilename && !uploadMutation.isPending ? (
            <div className="absolute bottom-2 left-2 right-2 rounded bg-bg-surface/90 backdrop-blur-xs px-2.5 py-1 text-[11px] text-action-secondary font-medium truncate">
              Foto terunggah: {stagedFilename} (belum disimpan ke database)
            </div>
          ) : null}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-default bg-bg-subtle/50 p-6 text-center cursor-pointer hover:border-border-strong hover:bg-bg-subtle transition-all max-w-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-text-muted shadow-sm">
            <Upload size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary">
              Pilih foto ruangan untuk diunggah
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Format .JPG, .PNG, atau .WEBP (Maksimal 5MB)
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        id="space-image-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}
