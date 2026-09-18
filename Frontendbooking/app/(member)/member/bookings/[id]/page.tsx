import { BookingDetailContent } from '@/features/bookings/components/booking-detail-content';

export const metadata = {
  title: 'Detail Reservasi — Smart Space Booking',
  description: 'Rincian jadwal dan status pemesanan workspace.',
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookingId = Number.parseInt(id, 10);

  return (
    <main>
      <BookingDetailContent bookingId={bookingId} />
    </main>
  );
}
