import { notFound } from 'next/navigation';
import { AdminReservationDetailPageContent } from '@/features/admin/reservations/components/reservation-detail';

export const metadata = {
  title: 'Operasi Detail Reservasi — Smart Space Booking Admin',
  description: 'Inspeksi rincian reservasi dan proses konfirmasi status, check-in, atau check-out.',
};

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const resId = Number.parseInt(id, 10);

  return (
    <div>
      <AdminReservationDetailPageContent reservationId={resId} />
    </div>
  );
}
