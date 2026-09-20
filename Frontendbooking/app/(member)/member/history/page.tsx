import { Suspense } from 'react';
import { MemberHistoryPageContent } from '@/features/bookings/components/member-history-page-content';

export const metadata = {
  title: 'Riwayat Pemesanan | Smart Space Booking',
  description: 'Riwayat reservasi member berdasarkan bulan dan tahun.',
};

export default function MemberHistoryPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <MemberHistoryPageContent />
      </Suspense>
    </main>
  );
}
