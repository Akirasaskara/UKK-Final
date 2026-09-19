import { notFound } from 'next/navigation';
import { ETicketContent } from '@/features/bookings/components/e-ticket-content';

export const metadata = {
  title: 'E-Ticket — Smart Space Booking',
  description: 'Tiket digital akses ruang kerja dengan QR code.',
};

export default async function ETicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const bookingId = Number.parseInt(id, 10);

  return (
    <main>
      <ETicketContent bookingId={bookingId} />
    </main>
  );
}
