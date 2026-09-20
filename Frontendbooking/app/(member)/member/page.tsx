import { MemberDashboardContent } from '@/features/bookings/components/member-dashboard-content';

export const metadata = {
  title: 'Dashboard Member | Smart Space Booking',
  description: 'Ringkasan booking dan akses cepat akun member.',
};

export default function MemberDashboardPage() {
  return (
    <main>
      <MemberDashboardContent />
    </main>
  );
}
