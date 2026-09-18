import { BookingListPageContent } from '@/features/bookings/components/booking-list-page-content';

export const metadata = {
  title: 'Booking Saya — Smart Space Booking',
  description: 'Daftar riwayat dan jadwal reservasi ruang kerja aktif.',
};

export default function BookingsPage() {
  return (
    <main>
      <BookingListPageContent />
    </main>
  );
}
