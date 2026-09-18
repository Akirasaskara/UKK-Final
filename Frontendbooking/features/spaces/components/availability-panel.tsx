'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { FormField, Input, fieldDescriptionId } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { checkSpaceAvailability } from '../api';
import type { AvailabilityResult } from '../schemas';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import Link from 'next/link';

const formSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal reservasi wajib dipilih.'),
  jam_mulai: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pilih jam mulai dengan format HH:mm.'),
  durasi_jam: z.number().int().min(1, 'Durasi minimal 1 jam.').max(12, 'Durasi maksimal 12 jam.'),
});

type FormValues = {
  tanggal: string;
  jam_mulai: string;
  durasi_jam: number;
};

type AvailabilityPanelProps = {
  spaceId: number;
};

export function AvailabilityPanel({
  spaceId,
}: AvailabilityPanelProps) {
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tanggal: todayStr,
      jam_mulai: '09:00',
      durasi_jam: 2,
    },
  });

  const [tanggalValue, jamMulaiValue, durasiValue] = watch(['tanggal', 'jam_mulai', 'durasi_jam']);

  // Tandai stale saat ada perubahan input
  useEffect(() => {
    if (result || errorMessage) {
      setIsStale(true);
    }
  }, [tanggalValue, jamMulaiValue, durasiValue, result, errorMessage]);

  async function onCheck(values: FormValues) {
    setIsPending(true);
    setErrorMessage(null);
    setIsStale(false);

    try {
      const res = await checkSpaceAvailability({
        id_space: spaceId,
        tanggal: values.tanggal,
        jam_mulai: values.jam_mulai,
        durasi_jam: Number(values.durasi_jam),
      });
      setResult(res);
      setCheckedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: unknown) {
      setResult(null);
      if (err && typeof err === 'object' && 'message' in err) {
        setErrorMessage((err as { message: string }).message);
      } else {
        setErrorMessage('Gagal memeriksa ketersediaan slot. Silakan coba lagi.');
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section
      aria-label="Pengecekan Ketersediaan Jadwal"
      className="rounded-card border border-border-default bg-bg-surface p-6 shadow-card space-y-6"
    >
      <header className="space-y-1">
        <h2 className="font-ui text-xl font-bold text-text-primary">
          Cek Ketersediaan Slot
        </h2>
        <p className="text-xs leading-relaxed text-text-muted">
          Pilih jadwal untuk melihat apakah ruangan tersedia sebelum membuat booking.
        </p>
      </header>

      <form onSubmit={handleSubmit(onCheck)} noValidate className="space-y-4">
        <FormField
          id="tanggal"
          label="Tanggal Penggunaan"
          required
          error={errors.tanggal?.message}
        >
          <Input
            id="tanggal"
            type="date"
            min={todayStr}
            aria-invalid={Boolean(errors.tanggal)}
            aria-describedby={fieldDescriptionId('tanggal', errors.tanggal?.message)}
            {...register('tanggal')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="jam_mulai"
            label="Jam Mulai"
            required
            error={errors.jam_mulai?.message}
          >
            <Input
              id="jam_mulai"
              type="time"
              step={1800}
              aria-invalid={Boolean(errors.jam_mulai)}
              aria-describedby={fieldDescriptionId('jam_mulai', errors.jam_mulai?.message)}
              {...register('jam_mulai')}
            />
          </FormField>

          <FormField
            id="durasi_jam"
            label="Durasi (Jam)"
            required
            error={errors.durasi_jam?.message}
          >
            <select
              id="durasi_jam"
              aria-invalid={Boolean(errors.durasi_jam)}
              aria-describedby={fieldDescriptionId('durasi_jam', errors.durasi_jam?.message)}
              className="min-h-11 w-full rounded-control border border-border-default bg-bg-surface px-3 py-2 text-base text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
              {...register('durasi_jam', { valueAsNumber: true })}
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((dur) => (
                <option key={dur} value={dur}>
                  {dur} Jam
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <Button type="submit" pending={isPending} className="w-full">
          {isPending ? 'Memeriksa Jadwal...' : 'Cek Ketersediaan'}
        </Button>
      </form>

      {/* Stale Warning Indicator */}
      {isStale && (result || errorMessage) ? (
        <div className="flex items-center gap-2 rounded-control border border-[var(--amber-800)]/30 bg-[var(--amber-50)] p-3 text-xs text-[var(--amber-800)]">
          <Clock size={16} className="shrink-0" aria-hidden="true" />
          <span>Jadwal telah diubah. Tekan tombol <strong>Cek Ketersediaan</strong> untuk memperbarui hasil.</span>
        </div>
      ) : null}

      {/* Error / Bentrok result */}
      {errorMessage && !isStale ? (
        <div className="rounded-control border border-status-danger-text bg-status-danger-bg p-4 space-y-2">
          <div className="flex items-center gap-2 text-status-danger-text font-bold text-sm">
            <AlertCircle size={18} aria-hidden="true" />
            <span>Slot Waktu Tidak Tersedia</span>
          </div>
          <p className="text-xs text-status-danger-text leading-relaxed">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {/* Available result */}
      {result && !isStale ? (
        <div className="rounded-control border border-status-success-text bg-status-success-bg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-status-success-text font-bold text-sm">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Tersedia untuk Dipesan</span>
            </div>
            {checkedAt ? (
              <span className="text-[11px] text-text-muted">Dicek {checkedAt} WIB</span>
            ) : null}
          </div>

          <dl className="text-xs space-y-1.5 border-t border-status-success-text/20 pt-2 text-text-primary">
            <div className="flex justify-between">
              <dt className="text-text-muted">Tanggal:</dt>
              <dd className="font-semibold">{formatDateIndonesia(result.tanggal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Waktu:</dt>
              <dd className="font-semibold">{result.jam_mulai} – {result.jam_selesai} WIB ({result.durasi_jam} jam)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Estimasi Biaya:</dt>
              <dd className="font-bold text-action-primary tabular-nums text-sm">
                {formatIdr(result.estimasi_total)}
              </dd>
            </div>
          </dl>

          <div className="pt-2">
            <Link
              href={`/login?returnTo=${encodeURIComponent(`/spaces/${spaceId}`)}`}
              className="flex min-h-11 w-full items-center justify-center rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
            >
              Masuk untuk Melanjutkan Reservasi
            </Link>
          </div>

          <p className="text-[11px] leading-relaxed text-text-muted text-center">
            Pengecekan bersifat indikatif. Ketersediaan resmi akan dikunci saat konfirmasi booking.
          </p>
        </div>
      ) : null}
    </section>
  );
}
