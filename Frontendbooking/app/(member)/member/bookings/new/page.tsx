import { BookingStepperForm } from '@/features/bookings/components/booking-stepper-form';
import { PublicContainer } from '@/components/public/public-container';
import Link from 'next/link';

export const metadata = {
  title: 'Buat Reservasi Baru — Smart Space Booking',
  description: 'Proses pemesanan dan reservasi ruang kerja 4 langkah.',
};

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    space_id?: string | string[];
    tanggal?: string | string[];
    jam_mulai?: string | string[];
    durasi_jam?: string | string[];
  }>;
}) {
  const { space_id, tanggal, jam_mulai, durasi_jam } = await searchParams;
  const parsedSpaceId = typeof space_id === 'string' ? Number.parseInt(space_id, 10) : NaN;
  const initialTanggal = typeof tanggal === 'string' ? tanggal : undefined;
  const initialJamMulai = typeof jam_mulai === 'string' ? jam_mulai : undefined;
  const initialDurasi = typeof durasi_jam === 'string' ? Number.parseInt(durasi_jam, 10) : undefined;

  if (!Number.isFinite(parsedSpaceId) || parsedSpaceId <= 0) {
    return (
      <PublicContainer className="py-16 text-center space-y-4">
        <h1 className="font-ui text-2xl font-bold text-text-primary">
          Pilih Ruangan Terlebih Dahulu
        </h1>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          Silakan pilih ruang kerja atau meeting room dari katalog sebelum memulai proses reservasi.
        </p>
        <div className="pt-2">
          <Link
            href="/spaces"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-action-primary px-5 py-2.5 text-sm font-semibold text-text-on-brand"
          >
            Buka Katalog Space
          </Link>
        </div>
      </PublicContainer>
    );
  }

  return (
    <main>
      <BookingStepperForm
        spaceId={parsedSpaceId}
        initialTanggal={initialTanggal}
        initialJamMulai={initialJamMulai}
        initialDurasi={initialDurasi}
      />
    </main>
  );
}
