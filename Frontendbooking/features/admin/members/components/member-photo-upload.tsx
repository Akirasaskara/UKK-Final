'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, User } from 'lucide-react';
import { useUploadMemberPhotoMutation } from '../hooks';
import { InlineAlert } from '@/components/ui/inline-alert';

type MemberPhotoUploadProps = {
  currentPhotoUrl?: string | null;
  currentFilename?: string | null;
  onPhotoUploaded: (filename: string | null) => void;
};

export function MemberPhotoUpload({
  currentPhotoUrl,
  currentFilename,
  onPhotoUploaded,
}: MemberPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMemberPhotoMutation();

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
        <label htmlFor="member-photo-input" className="text-sm font-semibold text-text-primary">
          Foto Profil Member
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

      <div className="flex items-center gap-4">
        {previewUrl ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-border-default bg-bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pratinjau foto profil"
              className="h-full w-full object-cover"
            />
            {uploadMutation.isPending ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRemovePhoto}
                aria-label="Hapus foto profil"
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-default bg-bg-subtle cursor-pointer hover:border-border-strong text-text-muted hover:text-text-primary transition-colors"
          >
            <User size={28} />
          </div>
        )}

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-border-default bg-bg-surface px-3 py-1 text-xs font-semibold text-text-primary hover:bg-bg-subtle transition-colors"
          >
            <Upload size={14} aria-hidden="true" />
            <span>Pilih Berkas Foto</span>
          </button>
          <p className="text-[11px] text-text-muted">
            Format .JPG, .PNG, atau .WEBP (Maks. 5MB)
          </p>
          {stagedFilename && !uploadMutation.isPending ? (
            <p className="text-[10px] text-action-secondary font-medium">
              Foto terunggah: {stagedFilename} (belum disimpan)
            </p>
          ) : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        id="member-photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}
