import { AdminDashboardPageContent } from '@/features/admin/dashboard/components/dashboard-page-content';

export const metadata = {
  title: 'Dashboard Pengelola — Smart Space Booking Admin',
  description: 'Ringkasan aktivitas operasional, antrean persetujuan, dan jadwal kedatangan.',
};

export default function AdminDashboardPage() {
  return (
    <div>
      <AdminDashboardPageContent />
    </div>
  );
}
