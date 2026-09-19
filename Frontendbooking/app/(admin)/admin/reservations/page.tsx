import { AdminReservationListPageContent } from '@/features/admin/reservations/components/reservation-list';

export const metadata = {
  title: 'Antrean Reservasi — Smart Space Booking Admin',
  description: 'Kelola jadwal masuk, konfirmasi persetujuan, check-in, dan check-out member.',
};

export default function AdminReservationsPage() {
  return (
    <div>
      <AdminReservationListPageContent />
    </div>
  );
}
