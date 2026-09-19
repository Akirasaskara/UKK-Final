'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField, Input, Textarea, fieldDescriptionId } from '@/components/ui/form-field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { SpaceImageUpload } from './space-image-upload';
import { useCreateSpaceMutation, useUpdateSpaceMutation } from '../hooks';
import { spaceFormInputSchema, type SpaceFormInput, type AdminSpaceDetail } from '../schemas';
import { formatSpaceType } from '@/lib/format/space';
import Link from 'next/link';

type AdminSpaceFormProps = {
  space?: AdminSpaceDetail; // Jika ada, mode Edit. Jika tidak, mode Create.
};

export function AdminSpaceForm({ space }: AdminSpaceFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(space);

  const createMutation = useCreateSpaceMutation();
  const updateMutation = useUpdateSpaceMutation();

  const [stagedFoto, setStagedFoto] = useState<string | null>(space?.foto || null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SpaceFormInput>({
    resolver: zodResolver(spaceFormInputSchema),
    defaultValues: {
      nama_space: space?.nama_space || '',
      harga_per_jam: space?.harga_per_jam ?? 25000,
      tipe: space?.tipe || 'desk',
      kapasitas: space?.kapasitas ?? 1,
      deskripsi: space?.deskripsi || '',
      foto: space?.foto || null,
      expected_version: space?.version,
    },
  });

  useEffect(() => {
    setValue('foto', stagedFoto, { shouldDirty: true });
  }, [stagedFoto, setValue]);

  async function onSubmit(values: SpaceFormInput) {
    setConflictError(null);

    if (isEditMode && space) {
      try {
        await updateMutation.mutateAsync({
          id: space.id,
          input: {
            ...values,
            foto: stagedFoto,
            expected_version: space.version,
          },
        });
        router.push(`/admin/spaces/${space.id}`);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 409) {
          setConflictError('Data space telah diperbarui oleh sesi lain. Silakan muat ulang halaman untuk mendapatkan versi terbaru.');
        }
      }
    } else {
      try {
        const res = await createMutation.mutateAsync({
          ...values,
          foto: stagedFoto,
        });
        router.push(`/admin/spaces/${res.id}`);
      } catch {
        // Error captured by mutation state
      }
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const activeError = createMutation.error || updateMutation.error;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-2xl">
      {conflictError ? (
        <InlineAlert title="Konflik Versi Data (409)" variant="danger">
          <p className="text-xs mt-1">{conflictError}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-3 inline-flex min-h-9 items-center rounded-control bg-status-danger-text px-3 py-1 text-xs font-semibold text-white"
          >
            Muat Ulang Halaman
          </button>
        </InlineAlert>
      ) : null}

      {activeError && !conflictError ? (
        <InlineAlert title="Gagal Menyimpan Data Space" variant="danger">
          <p className="text-xs mt-1">
            {activeError instanceof Error ? activeError.message : 'Terjadi kendala saat menyimpan data.'}
          </p>
        </InlineAlert>
      ) : null}

      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-5">
        <FormField
          id="nama_space"
          label="Nama Space Ruangan"
          required
          error={errors.nama_space?.message}
        >
          <Input
            id="nama_space"
            placeholder="Contoh: Dedicated Desk Alpha 01, Meeting Room B..."
            aria-invalid={Boolean(errors.nama_space)}
            aria-describedby={fieldDescriptionId('nama_space', errors.nama_space?.message)}
            {...register('nama_space')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="tipe"
            label="Kategori Ruang"
            required
            error={errors.tipe?.message}
          >
            <select
              id="tipe"
              aria-invalid={Boolean(errors.tipe)}
              aria-describedby={fieldDescriptionId('tipe', errors.tipe?.message)}
              className="min-h-12 w-full rounded-control border border-border-default bg-bg-surface px-3 py-2 text-base text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
              {...register('tipe')}
            >
              <option value="desk">{formatSpaceType('desk')}</option>
              <option value="meeting_room">{formatSpaceType('meeting_room')}</option>
              <option value="private_office">{formatSpaceType('private_office')}</option>
            </select>
          </FormField>

          <FormField
            id="kapasitas"
            label="Kapasitas Maksimal (Orang)"
            required
            error={errors.kapasitas?.message}
          >
            <Input
              id="kapasitas"
              type="number"
              min={1}
              aria-invalid={Boolean(errors.kapasitas)}
              aria-describedby={fieldDescriptionId('kapasitas', errors.kapasitas?.message)}
              {...register('kapasitas', { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <FormField
          id="harga_per_jam"
          label="Tarif Sewa per Jam (IDR)"
          required
          error={errors.harga_per_jam?.message}
          helper="Masukkan angka bulat tanpa titik/koma (contoh: 25000 untuk Rp25.000)."
        >
          <Input
            id="harga_per_jam"
            type="number"
            min={0}
            step={1000}
            aria-invalid={Boolean(errors.harga_per_jam)}
            aria-describedby={fieldDescriptionId('harga_per_jam', errors.harga_per_jam?.message, 'Masukkan angka bulat.')}
            {...register('harga_per_jam', { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          id="deskripsi"
          label="Fasilitas & Deskripsi Ruang"
          required
          error={errors.deskripsi?.message}
          helper="Sebutkan fasilitas meja, kursi ergonomis, kecepatan WiFi, monitor, atau sound system."
        >
          <Textarea
            id="deskripsi"
            placeholder="Tuliskan kelengkapan fasilitas yang disediakan di ruangan ini..."
            aria-invalid={Boolean(errors.deskripsi)}
            aria-describedby={fieldDescriptionId('deskripsi', errors.deskripsi?.message, 'Sebutkan fasilitas.')}
            {...register('deskripsi')}
          />
        </FormField>

        <div className="border-t border-border-default pt-4">
          <SpaceImageUpload
            currentPhotoUrl={space?.foto_url}
            currentFilename={space?.foto}
            onPhotoUploaded={(filename) => setStagedFoto(filename)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href={isEditMode && space ? `/admin/spaces/${space.id}` : '/admin/spaces'}
          className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
        >
          Batal & Kembali
        </Link>
        <Button type="submit" pending={isPending} className="min-w-44">
          {isPending ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Tambah Space Baru'}
        </Button>
      </div>
    </form>
  );
}
