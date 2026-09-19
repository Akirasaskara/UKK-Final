'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField, Input, Textarea, fieldDescriptionId } from '@/components/ui/form-field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { useAdminProfile, useUpdateAdminProfileMutation } from '../hooks';
import { updateAdminProfileInputSchema, type UpdateAdminProfileInput } from '../schemas';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminProfileForm() {
  const { data: profile, isLoading, isError, error, refetch } = useAdminProfile();
  const updateMutation = useUpdateAdminProfileMutation();
  const [successNotice, setSuccessNotice] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-md">
        <InlineAlert title="Gagal Memuat Profil" variant="danger">
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data profil coworking space.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex min-h-10 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand"
            >
              Coba Lagi
            </button>
          </div>
        </InlineAlert>
      </div>
    );
  }

  return (
    <AdminProfileFormInner
      initialProfile={profile}
      isUpdating={updateMutation.isPending}
      mutationError={updateMutation.error instanceof Error ? updateMutation.error.message : null}
      successNotice={successNotice}
      onSubmit={async (values) => {
        setSuccessNotice(false);
        await updateMutation.mutateAsync(values);
        setSuccessNotice(true);
      }}
    />
  );
}

function AdminProfileFormInner({
  initialProfile,
  isUpdating,
  mutationError,
  successNotice,
  onSubmit,
}: {
  initialProfile: {
    nama_coworking: string;
    nama_pemilik: string;
    telp: string;
    alamat?: string | null;
    deskripsi_fasilitas?: string | null;
  };
  isUpdating: boolean;
  mutationError: string | null;
  successNotice: boolean;
  onSubmit: (values: UpdateAdminProfileInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateAdminProfileInput>({
    resolver: zodResolver(updateAdminProfileInputSchema),
    defaultValues: {
      nama_coworking: initialProfile.nama_coworking,
      nama_pemilik: initialProfile.nama_pemilik,
      telp: initialProfile.telp,
      alamat: initialProfile.alamat || '',
      deskripsi_fasilitas: initialProfile.deskripsi_fasilitas || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-2xl">
      {successNotice ? (
        <InlineAlert title="Profil Berhasil Diperbarui" variant="success">
          <p className="text-xs mt-1">Informasi coworking space Anda telah berhasil disimpan.</p>
        </InlineAlert>
      ) : null}

      {mutationError ? (
        <InlineAlert title="Gagal Menyimpan Profil" variant="danger">
          <p className="text-xs mt-1">{mutationError}</p>
        </InlineAlert>
      ) : null}

      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-5">
        <FormField
          id="nama_coworking"
          label="Nama Coworking Space"
          required
          error={errors.nama_coworking?.message}
        >
          <Input
            id="nama_coworking"
            aria-invalid={Boolean(errors.nama_coworking)}
            aria-describedby={fieldDescriptionId('nama_coworking', errors.nama_coworking?.message)}
            {...register('nama_coworking')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="nama_pemilik"
            label="Nama Pemilik / Penanggung Jawab"
            required
            error={errors.nama_pemilik?.message}
          >
            <Input
              id="nama_pemilik"
              aria-invalid={Boolean(errors.nama_pemilik)}
              aria-describedby={fieldDescriptionId('nama_pemilik', errors.nama_pemilik?.message)}
              {...register('nama_pemilik')}
            />
          </FormField>

          <FormField
            id="telp"
            label="Nomor Kontak Operasional"
            required
            error={errors.telp?.message}
          >
            <Input
              id="telp"
              type="tel"
              inputMode="tel"
              aria-invalid={Boolean(errors.telp)}
              aria-describedby={fieldDescriptionId('telp', errors.telp?.message)}
              {...register('telp')}
            />
          </FormField>
        </div>

        <FormField
          id="alamat"
          label="Alamat Lengkap Lokasi"
          error={errors.alamat?.message}
        >
          <Textarea
            id="alamat"
            placeholder="Alamat fisik coworking space Anda..."
            aria-invalid={Boolean(errors.alamat)}
            aria-describedby={fieldDescriptionId('alamat', errors.alamat?.message)}
            {...register('alamat')}
          />
        </FormField>

        <FormField
          id="deskripsi_fasilitas"
          label="Deskripsi Fasilitas Umum"
          error={errors.deskripsi_fasilitas?.message}
          helper="Fasilitas umum seperti Musholla, Parkir, Pantry, High-Speed Internet, dll."
        >
          <Textarea
            id="deskripsi_fasilitas"
            placeholder="Tuliskan fasilitas umum yang tersedia di coworking Anda..."
            aria-invalid={Boolean(errors.deskripsi_fasilitas)}
            aria-describedby={fieldDescriptionId('deskripsi_fasilitas', errors.deskripsi_fasilitas?.message, 'Fasilitas umum.')}
            {...register('deskripsi_fasilitas')}
          />
        </FormField>
      </div>

      <div className="flex justify-end">
        <Button type="submit" pending={isUpdating} className="min-w-44">
          {isUpdating ? 'Menyimpan Profil...' : 'Simpan Profil'}
        </Button>
      </div>
    </form>
  );
}
