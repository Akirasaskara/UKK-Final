'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField, Input, fieldDescriptionId } from '@/components/ui/form-field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { useCreatePromotionMutation, useUpdatePromotionMutation } from '../hooks';
import { promotionFormInputSchema, type PromotionFormInput, type AdminPromotionDetail } from '../schemas';
import Link from 'next/link';

type PromotionFormProps = {
  promotion?: AdminPromotionDetail; // Jika ada, mode Edit. Jika tidak, mode Create.
};

function formatUtcToDateTimeLocal(utcIso?: string): string {
  if (!utcIso) return '';
  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function PromotionForm({ promotion }: PromotionFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(promotion);

  const createMutation = useCreatePromotionMutation();
  const updateMutation = useUpdatePromotionMutation();

  const [conflictError, setConflictError] = useState<string | null>(null);

  const now = new Date();
  const defaultStart = formatUtcToDateTimeLocal(now.toISOString());
  const defaultEnd = formatUtcToDateTimeLocal(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromotionFormInput>({
    resolver: zodResolver(promotionFormInputSchema),
    defaultValues: {
      nama_diskon: promotion?.nama_diskon || '',
      persentase_diskon: promotion?.persentase_diskon ?? 10,
      tanggal_awal: promotion?.tanggal_awal ? formatUtcToDateTimeLocal(promotion.tanggal_awal) : defaultStart,
      tanggal_akhir: promotion?.tanggal_akhir ? formatUtcToDateTimeLocal(promotion.tanggal_akhir) : defaultEnd,
      expected_version: promotion?.version,
    },
  });

  async function onSubmit(values: PromotionFormInput) {
    setConflictError(null);

    // Konversi string input datetime-local ke ISO UTC
    const startIso = new Date(values.tanggal_awal).toISOString();
    const endIso = new Date(values.tanggal_akhir).toISOString();

    if (isEditMode && promotion) {
      try {
        await updateMutation.mutateAsync({
          id: promotion.id,
          input: {
            nama_diskon: values.nama_diskon,
            persentase_diskon: values.persentase_diskon,
            tanggal_awal: startIso,
            tanggal_akhir: endIso,
            expected_version: promotion.version,
          },
        });
        router.push('/admin/promotions');
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 409) {
          setConflictError('Data promosi telah diubah oleh sesi lain. Silakan muat ulang halaman untuk mendapatkan versi terbaru.');
        }
      }
    } else {
      try {
        await createMutation.mutateAsync({
          nama_diskon: values.nama_diskon,
          persentase_diskon: values.persentase_diskon,
          tanggal_awal: startIso,
          tanggal_akhir: endIso,
        });
        router.push('/admin/promotions');
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
        <InlineAlert title="Gagal Menyimpan Promosi" variant="danger">
          <p className="text-xs mt-1">
            {activeError instanceof Error ? activeError.message : 'Terjadi kendala saat menyimpan data promosi.'}
          </p>
        </InlineAlert>
      ) : null}

      <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-5">
        <FormField
          id="nama_diskon"
          label="Kode Promo Diskon"
          required
          error={errors.nama_diskon?.message}
          helper="Gunakan huruf kapital tanpa spasi (contoh: HEMAT20, PROMOBARU). Server akan otomatis menormalkan spasi dan kapitalisasi."
        >
          <Input
            id="nama_diskon"
            placeholder="Contoh: HEMAT20"
            className="font-mono text-sm uppercase"
            aria-invalid={Boolean(errors.nama_diskon)}
            aria-describedby={fieldDescriptionId('nama_diskon', errors.nama_diskon?.message, 'Huruf kapital tanpa spasi.')}
            {...register('nama_diskon')}
          />
        </FormField>

        <FormField
          id="persentase_diskon"
          label="Besaran Potongan Diskon (%)"
          required
          error={errors.persentase_diskon?.message}
          helper="Masukkan persentase bulat antara 1% hingga 100%."
        >
          <Input
            id="persentase_diskon"
            type="number"
            min={1}
            max={100}
            aria-invalid={Boolean(errors.persentase_diskon)}
            aria-describedby={fieldDescriptionId('persentase_diskon', errors.persentase_diskon?.message, 'Persentase 1-100%.')}
            {...register('persentase_diskon', { valueAsNumber: true })}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="tanggal_awal"
            label="Mulai Berlaku (Waktu Lokal)"
            required
            error={errors.tanggal_awal?.message}
          >
            <Input
              id="tanggal_awal"
              type="datetime-local"
              aria-invalid={Boolean(errors.tanggal_awal)}
              aria-describedby={fieldDescriptionId('tanggal_awal', errors.tanggal_awal?.message)}
              {...register('tanggal_awal')}
            />
          </FormField>

          <FormField
            id="tanggal_akhir"
            label="Kedaluwarsa (Waktu Lokal)"
            required
            error={errors.tanggal_akhir?.message}
          >
            <Input
              id="tanggal_akhir"
              type="datetime-local"
              aria-invalid={Boolean(errors.tanggal_akhir)}
              aria-describedby={fieldDescriptionId('tanggal_akhir', errors.tanggal_akhir?.message)}
              {...register('tanggal_akhir')}
            />
          </FormField>
        </div>

        <p className="text-[11px] text-text-muted leading-relaxed border-t border-border-default pt-3">
          Zona Waktu Referensi: <strong>Asia/Jakarta (WIB)</strong>. Status aktif/kedaluwarsa akan dihitung otomatis oleh server berdasarkan jadwal di atas.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/promotions"
          className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
        >
          Batal & Kembali
        </Link>
        <Button type="submit" pending={isPending} className="min-w-44">
          {isPending ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Buat Promo Baru'}
        </Button>
      </div>
    </form>
  );
}
