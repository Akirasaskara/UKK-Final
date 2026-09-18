'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form-field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PublicContainer } from '@/components/public/public-container';
import { checkSpaceAvailability } from '@/features/spaces/api';
import { usePublicSpace } from '@/features/spaces/hooks';
import { useActivePromotions } from '@/features/promotions/hooks';
import { useCreateBookingMutation } from '../hooks';
import type { AvailabilityResult } from '@/features/spaces/schemas';
import type { ActivePromotion } from '@/features/promotions/schemas';
import { formatIdr } from '@/lib/format/currency';
import { formatDateIndonesia } from '@/lib/format/date';
import { formatSpaceType } from '@/lib/format/space';

type Step = 1 | 2 | 3 | 4;

export function BookingStepperForm({ spaceId }: { spaceId: number }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [tanggal, setTanggal] = useState(todayStr);
  const [jamMulai, setJamMulai] = useState('09:00');
  const [durasiJam, setDurasiJam] = useState(2);

  // Availability state
  const [availResult, setAvailResult] = useState<AvailabilityResult | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);

  // Promo selection
  const [selectedPromo, setSelectedPromo] = useState<ActivePromotion | null>(null);

  // Query space data
  const { data: space, isLoading: spaceLoading } = usePublicSpace(spaceId);
  const { data: promotions } = useActivePromotions();

  // Create booking mutation
  const createMutation = useCreateBookingMutation();

  // Step 1: Cek ketersediaan
  async function handleCheckAvailability(e: React.FormEvent) {
    e.preventDefault();
    setIsCheckingAvail(true);
    setAvailError(null);

    try {
      const res = await checkSpaceAvailability({
        id_space: spaceId,
        tanggal,
        jam_mulai: jamMulai,
        durasi_jam: durasiJam,
      });
      setAvailResult(res);
      setCurrentStep(2);
    } catch (err: unknown) {
      setAvailResult(null);
      if (err && typeof err === 'object' && 'message' in err) {
        setAvailError((err as { message: string }).message);
      } else {
        setAvailError('Jadwal bentrok atau tidak tersedia. Silakan pilih waktu lain.');
      }
    } finally {
      setIsCheckingAvail(false);
    }
  }

  // Perhitungan diskon & total
  const basePrice = (space?.harga_per_jam ?? 0) * durasiJam;
  const discountPercent = selectedPromo?.persentase_diskon ?? 0;
  const discountAmount = Math.round((basePrice * discountPercent) / 100);
  const finalTotal = Math.max(0, basePrice - discountAmount);

  // Step 4: Submit booking
  async function handleConfirmBooking() {
    if (!availResult) return;

    try {
      const res = await createMutation.mutateAsync({
        id_space: spaceId,
        tanggal_reservasi: tanggal,
        jam_mulai: jamMulai,
        durasi_jam: durasiJam,
        id_diskon: selectedPromo?.id,
        kode_promo: selectedPromo?.nama_diskon,
      });

      router.push(`/member/bookings/${res.id}`);
    } catch {
      // Error handled by mutation state
    }
  }

  if (spaceLoading || !space) {
    return (
      <PublicContainer className="py-12">
        <p className="text-sm text-text-muted">Memuat data ruangan...</p>
      </PublicContainer>
    );
  }

  return (
    <PublicContainer className="py-8 sm:py-12 max-w-3xl space-y-8">
      {/* Stepper Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Reservasi {space.nama_space}
          </h1>
          <span className="text-xs font-semibold rounded-badge bg-bg-subtle px-3 py-1 text-text-secondary">
            Langkah {currentStep} dari 4
          </span>
        </div>

        {/* Stepper Visual Bar */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          {[
            { step: 1, label: '1. Jadwal' },
            { step: 2, label: '2. Promo' },
            { step: 3, label: '3. Tinjau' },
            { step: 4, label: '4. Konfirmasi' },
          ].map((item) => (
            <div
              key={item.step}
              className={`rounded-control p-2.5 transition-colors ${
                currentStep === item.step
                  ? 'bg-action-primary text-text-on-brand'
                  : currentStep > item.step
                  ? 'bg-status-success-bg text-status-success-text'
                  : 'bg-bg-subtle text-text-muted'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Pilih Jadwal & Cek Ketersediaan */}
      {currentStep === 1 ? (
        <form onSubmit={handleCheckAvailability} className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6">
          <div className="space-y-1">
            <h2 className="font-ui text-lg font-bold text-text-primary">
              Langkah 1: Tentukan Jadwal Penggunaan
            </h2>
            <p className="text-xs text-text-muted">
              Pilih tanggal, jam mulai, dan durasi penggunaan ruangan.
            </p>
          </div>

          {availError ? (
            <InlineAlert title="Slot Tidak Tersedia" variant="danger">
              <p className="text-xs mt-1">{availError}</p>
            </InlineAlert>
          ) : null}

          <div className="space-y-4">
            <FormField id="tanggal" label="Tanggal Reservasi" required>
              <Input
                id="tanggal"
                type="date"
                min={todayStr}
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField id="jam_mulai" label="Jam Mulai" required>
                <Input
                  id="jam_mulai"
                  type="time"
                  step={1800}
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  required
                />
              </FormField>

              <FormField id="durasi_jam" label="Durasi Sewa" required>
                <select
                  id="durasi_jam"
                  value={durasiJam}
                  onChange={(e) => setDurasiJam(Number(e.target.value))}
                  className="min-h-12 w-full rounded-control border border-border-default bg-bg-surface px-3 py-2 text-base text-text-primary outline-none focus-visible:border-[var(--teal-700)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((d) => (
                    <option key={d} value={d}>
                      {d} Jam
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" pending={isCheckingAvail} className="w-full">
              {isCheckingAvail ? 'Memeriksa Slot...' : 'Cek Ketersediaan & Lanjut'}
            </Button>
          </div>
        </form>
      ) : null}

      {/* STEP 2: Pilih Promo */}
      {currentStep === 2 ? (
        <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6">
          <div className="space-y-1">
            <h2 className="font-ui text-lg font-bold text-text-primary">
              Langkah 2: Pilih Promo Diskon
            </h2>
            <p className="text-xs text-text-muted">
              Pilih promo yang tersedia untuk mendapatkan potongan harga sewa.
            </p>
          </div>

          <div className="space-y-3">
            {/* Opsi Tanpa Promo */}
            <label
              className={`flex items-center justify-between p-4 rounded-control border cursor-pointer transition-all ${
                selectedPromo === null
                  ? 'border-action-primary bg-bg-subtle ring-1 ring-action-primary'
                  : 'border-border-default hover:border-border-strong'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="promo_selection"
                  checked={selectedPromo === null}
                  onChange={() => setSelectedPromo(null)}
                  className="h-4 w-4 text-action-primary focus:ring-action-primary"
                />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Tanpa Promo</p>
                  <p className="text-xs text-text-muted">Gunakan tarif standar sewa ruangan.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-text-muted">Rp0</span>
            </label>

            {/* List Promo Aktif */}
            {promotions?.map((p) => {
              const isSelected = selectedPromo?.id === p.id;
              return (
                <label
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-control border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-action-primary bg-bg-subtle ring-1 ring-action-primary'
                      : 'border-border-default hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="promo_selection"
                      checked={isSelected}
                      onChange={() => setSelectedPromo(p)}
                      className="h-4 w-4 text-action-primary focus:ring-action-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{p.nama_diskon}</p>
                      <p className="text-xs text-action-secondary font-medium">Diskon {p.persentase_diskon}%</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-status-success-text">
                    Hemat {formatIdr(Math.round((basePrice * p.persentase_diskon) / 100))}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Kembali ke Jadwal
            </button>
            <Button type="button" onClick={() => setCurrentStep(3)}>
              Lanjut ke Peninjauan
            </Button>
          </div>
        </div>
      ) : null}

      {/* STEP 3: Tinjau Rincian Booking */}
      {currentStep === 3 ? (
        <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6">
          <div className="space-y-1">
            <h2 className="font-ui text-lg font-bold text-text-primary">
              Langkah 3: Tinjau Rincian Reservasi
            </h2>
            <p className="text-xs text-text-muted">
              Pastikan seluruh jadwal dan estimasi pembayaran sudah benar sebelum melakukan konfirmasi.
            </p>
          </div>

          <div className="rounded-control border border-border-default bg-bg-subtle p-5 space-y-4">
            <div className="space-y-2 border-b border-border-default pb-3">
              <p className="text-xs font-semibold text-action-secondary">{space.owner?.nama_coworking}</p>
              <p className="text-lg font-bold text-text-primary">{space.nama_space}</p>
              <p className="text-xs text-text-muted">Kategori: {formatSpaceType(space.tipe)} • Kapasitas {space.kapasitas} orang</p>
            </div>

            <dl className="text-xs space-y-2">
              <div className="flex justify-between">
                <dt className="text-text-muted">Tanggal:</dt>
                <dd className="font-semibold">{formatDateIndonesia(tanggal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Waktu:</dt>
                <dd className="font-semibold">{jamMulai} – {availResult?.jam_selesai} WIB ({durasiJam} jam)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Tarif Sewa:</dt>
                <dd className="tabular-nums">{formatIdr(space.harga_per_jam)} / jam</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Subtotal Awal:</dt>
                <dd className="tabular-nums">{formatIdr(basePrice)}</dd>
              </div>
              {selectedPromo ? (
                <div className="flex justify-between text-status-success-text">
                  <dt>Promo ({selectedPromo.nama_diskon} - {selectedPromo.persentase_diskon}%):</dt>
                  <dd className="tabular-nums font-semibold">- {formatIdr(discountAmount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border-default pt-2 text-sm font-bold text-text-primary">
                <dt>Total Bayar:</dt>
                <dd className="tabular-nums text-action-primary text-base">{formatIdr(finalTotal)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Kembali ke Promo
            </button>
            <Button type="button" onClick={() => setCurrentStep(4)}>
              Lanjut ke Konfirmasi
            </Button>
          </div>
        </div>
      ) : null}

      {/* STEP 4: Konfirmasi Final & Buat Booking */}
      {currentStep === 4 ? (
        <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-6">
          <div className="space-y-1">
            <h2 className="font-ui text-lg font-bold text-text-primary">
              Langkah 4: Konfirmasi Pemesanan
            </h2>
            <p className="text-xs text-text-muted">
              Pemesanan Anda akan disimpan ke sistem dan slot ruangan akan dikunci.
            </p>
          </div>

          {createMutation.isError ? (
            <InlineAlert title="Pemesanan Gagal Diproses" variant="danger">
              <p className="text-xs mt-1">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : 'Terjadi bentrok jadwal atau kendala server saat memproses booking.'}
              </p>
            </InlineAlert>
          ) : null}

          <div className="rounded-control border border-[var(--teal-700)]/30 bg-[var(--teal-50)] p-5 space-y-3">
            <div className="flex items-center gap-2 text-action-primary font-bold text-sm">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Ringkasan Akhir Pemesanan</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Anda memesan <strong>{space.nama_space}</strong> untuk tanggal <strong>{formatDateIndonesia(tanggal)}</strong> pukul <strong>{jamMulai} – {availResult?.jam_selesai} WIB</strong> dengan total bayar <strong>{formatIdr(finalTotal)}</strong>.
            </p>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Dengan menekan tombol di bawah, Anda menyetujui jadwal yang dipilih. E-ticket dengan QR code akan diterbitkan setelah booking dibuat.
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              Kembali ke Peninjauan
            </button>
            <Button
              type="button"
              pending={createMutation.isPending}
              onClick={handleConfirmBooking}
              className="min-w-40"
            >
              {createMutation.isPending ? 'Menyimpan Booking...' : 'Konfirmasi Booking Sekarang'}
            </Button>
          </div>
        </div>
      ) : null}
    </PublicContainer>
  );
}
